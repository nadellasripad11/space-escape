// ---- shared art: stars + planet (for close-ups), HUD, toast, props ------------

function drawStars(parent, seed, count, x0, y0, w, h) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const s = r() < 0.12 ? 3 : r() < 0.4 ? 2 : 1;
    ellipse(parent, x0 + r() * w, y0 + r() * h, s, s, {
      fill: r() < 0.15 ? C.cyan : C.white,
      op: 0.25 + r() * 0.75,
      name: 'star',
    });
  }
}

function drawPlanet(parent, x, y, d) {
  ellipse(parent, x - d * 0.12, y - d * 0.12, d * 1.24, d * 1.24, {
    fill: radial([
      [0.7, '#27d3ff', 0.0],
      [1, '#27d3ff', 0.18],
    ]),
    name: 'atmosphere',
  });
  ellipse(parent, x, y, d, d, {
    fill: [linear([[0, '#1b4f9c'], [0.55, '#0d2a5c'], [1, '#050c1d']], 125)],
    name: 'planet',
  });
  const r = rng(7);
  for (let i = 0; i < 5; i++) {
    const bw = d * (0.3 + r() * 0.4);
    ellipse(parent, x + r() * (d - bw), y + d * (0.15 + i * 0.15), bw, d * 0.05, {
      fill: '#5db4ff',
      op: 0.1 + r() * 0.12,
      name: 'cloud',
    });
  }
}

function pulse(parent, x, y, col) {
  ellipse(parent, x - 22, y - 22, 44, 44, { fill: radial([[0, col, 0.55], [1, col, 0]]), name: 'glint' });
  ellipse(parent, x - 4, y - 4, 8, 8, { fill: col, fx: [glow(col, 12, 0.9)], name: 'glint core' });
}

function porthole(parent, x, y, d, seed) {
  const g = frame(parent, x, y, d, d, { noclip: true, name: 'porthole' });
  ellipse(g, -10, -10, d + 20, d + 20, {
    fill: linear([[0, '#2b3d5e'], [1, '#0d1626']], 45),
    stroke: '#3a5282',
    sw: 2,
    fx: [shadow(8, 18, 0.6)],
    name: 'porthole rim',
  });
  const inner = frame(g, 0, 0, d, d, { name: 'porthole view' });
  inner.cornerRadius = d / 2;
  inner.fills = [solid('#02040a')];
  drawStars(inner, seed, 40, 0, 0, d, d);
  drawPlanet(inner, d * 0.2, d * 0.45, d * 0.9);
  ellipse(g, 0, 0, d, d, { fill: linear([[0, '#ffffff', 0.18], [0.4, '#ffffff', 0]], 45), name: 'glass' });
  return g;
}

function hazardStripe(parent, x, y, w, h) {
  const g = frame(parent, x, y, w, h, { fill: '#171a22', name: 'hazard' });
  const step = h * 1.6;
  for (let i = -2; i < w / step + 2; i++) {
    path(g, i * step, 0, 'M ' + step * 0.5 + ' 0 L ' + step + ' 0 L ' + (step * 0.5 + h) + ' ' + h + ' L 0 ' + h + ' Z', { fill: C.amber, op: 0.92, name: 'stripe' });
  }
  return g;
}

function drawKeycard(parent, x, y, w, name) {
  const h = w * 0.64;
  const g = frame(parent, x, y, w, h, {
    noclip: true,
    fill: linear([[0, '#2b7bff'], [1, '#0b2d7a']], 45),
    stroke: '#9fd0ff',
    sw: 1.5,
    r: w * 0.09,
    fx: [glow('#27d3ff', w * 0.4, 0.7)],
    name: name || 'keycard',
  });
  rect(g, 0, h * 0.2, w, h * 0.18, { fill: '#000000', op: 0.55, name: 'stripe' });
  rect(g, w * 0.1, h * 0.58, w * 0.22, h * 0.26, { fill: '#ffd23b', r: 3, name: 'chip' });
  text(g, w * 0.4, h * 0.6, 'LVL 2', { font: 'head', size: Math.max(7, w * 0.11), fill: C.white, name: 'level' });
  return g;
}

// ---- HUD ----------------------------------------------------------------------

function hud(parent, roomLabel, o2, held, hint) {
  rect(parent, 0, 0, W, 78, {
    fill: linear([[0, '#000000', 0.7], [1, '#000000', 0]], 90),
    name: 'hud shade',
  });
  text(parent, 36, 24, 'STATION OMEGA-7', { font: 'mono', size: 13, fill: C.cyan, ls: 4, name: 'hud / station' });
  text(parent, 256, 24, '//  ' + roomLabel, { font: 'mono', size: 13, fill: '#a9c3e6', ls: 3, name: 'hud / room' });

  const low = o2 <= 10;
  const col = low ? C.red : o2 <= 30 ? C.amber : C.cyan;
  glass(parent, W - 36 - 372, 14, 372, 40, { r: 20, op: 0.5, shadow: false, name: 'o2 glass' });
  text(parent, W - 36 - 352, 24, 'O2', { font: 'head', size: 13, fill: col, ls: 3, name: 'hud / o2 label' });
  rect(parent, W - 36 - 312, 31, 252, 8, { fill: '#ffffff', op: 0.1, r: 4, name: 'o2 track' });
  rect(parent, W - 36 - 312, 31, Math.max(8, 252 * (o2 / 100)), 8, { fill: col, r: 4, fx: [glow(col, 10, 0.9)], name: 'o2 fill' });
  text(parent, W - 36 - 54, 24, o2 + '%', { font: 'head', size: 13, fill: col, w: 40, align: 'RIGHT', name: 'hud / o2 pct' });

  const iy = H - 96;
  text(parent, 36, iy - 24, 'INVENTORY', { font: 'mono', size: 11, fill: '#a9c3e6', ls: 3, name: 'inv label' });
  for (let i = 0; i < 3; i++) glass(parent, 36 + i * 76, iy, 68, 68, { r: 14, op: 0.5, blur: 14, name: 'inv slot' });
  if (held) drawKeycard(parent, 36 + 9, iy + 20, 50, 'inv / keycard');

  if (hint) {
    glass(parent, 640, 14, 140, 38, { r: 19, op: 0.5, stroke: C.cyan, strokeOp: 0.5, shadow: false, name: 'hint button' });
    text(parent, 640, 14, '?  HINT', { font: 'mono', size: 13, fill: C.cyan, ls: 3, w: 140, align: 'CENTER', lh: 38, name: 'hint label' });
    go(hotspot(parent, 636, 10, 148, 46, 'hint'), hint, { d: 0.2 });
  }
}

function toast(parent, msg, tone) {
  const col = tone === 'bad' ? C.red : tone === 'good' ? C.green : C.cyan;
  const w = 780;
  const g = glass(parent, (W - w) / 2, H - 150, w, 76, { r: 18, op: 0.66, stroke: col, strokeOp: 0.7, glow: col, glowA: 0.28, name: 'toast' });
  rect(parent, (W - w) / 2 + 14, H - 150 + 20, 5, 36, { fill: col, r: 3, fx: [glow(col, 12, 0.8)], name: 'toast bar' });
  text(parent, (W - w) / 2 + 40, H - 150, msg, { font: 'mono', size: 19, fill: C.white, w: w - 70, lh: 76, name: 'toast / text' });
  return g;
}
