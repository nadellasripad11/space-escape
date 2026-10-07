// ---- prototype wiring: turn link tags in layer names into reactions ----------
async function wire() {
  const page = figma.currentPage;
  const frames = {};
  for (const f of page.children) if (f.type === 'FRAME') frames[f.name.split(' · ')[0]] = f;
  const topFrame = (x) => {
    while (x.parent && x.parent.type !== 'PAGE') x = x.parent;
    return x;
  };

  const tagged = page.findAll((n) => n.name.includes(' → {'));
  const byNode = new Map();
  const edges = [];
  const specs = [];
  for (const n of tagged) {
    const i = n.name.indexOf(' → ');
    const spec = JSON.parse(n.name.slice(i + 3));
    specs.push([n, n.name.slice(0, i)]);
    const owner = spec.k === 'timer' ? n.parent : n;
    const ownKey = topFrame(owner).name.split(' · ')[0];
    if (spec.to === ownKey) continue; // figma rejects self-navigation
    let action;
    if (spec.to === 'BACK') {
      action = { type: 'BACK' };
    } else {
      const dest = frames[spec.to];
      if (!dest) throw new Error('missing frame: ' + spec.to);
      const tr = { type: spec.t || 'DISSOLVE', easing: { type: spec.ease || 'EASE_OUT' }, duration: spec.d === undefined ? 0.22 : spec.d };
      if (tr.type === 'PUSH' || tr.type === 'MOVE_IN' || tr.type === 'SLIDE_IN') {
        tr.direction = spec.dir || 'LEFT';
        tr.matchLayers = false;
      }
      action = { type: 'NODE', destinationId: dest.id, navigation: 'NAVIGATE', transition: tr, resetVideoPosition: false };
    }
    const trigger = spec.k === 'timer' ? { type: 'AFTER_TIMEOUT', timeout: spec.s } : { type: 'ON_CLICK' };
    if (!byNode.has(owner)) byNode.set(owner, []);
    byNode.get(owner).push({ trigger, actions: [action] });
    edges.push([ownKey, spec.to]);
  }
  for (const [n, reactions] of byNode) await n.setReactionsAsync(reactions);
  for (const [n, base] of specs) n.name = base; // strip tags only after everything succeeded

  page.flowStartingPoints = [{ nodeId: frames.title.id, name: 'Play OMEGA-7' }];

  const adj = {};
  for (const [a, b] of edges) (adj[a] = adj[a] || new Set()).add(b);
  const seen = new Set(['title']);
  const queue = ['title'];
  while (queue.length) {
    const x = queue.shift();
    for (const y of adj[x] || []) if (y !== 'BACK' && !seen.has(y)) { seen.add(y); queue.push(y); }
  }
  return { frames: Object.keys(frames).length, links: byNode.size, winReachable: seen.has('win'), unreachable: Object.keys(frames).filter((k) => !seen.has(k)) };
}
