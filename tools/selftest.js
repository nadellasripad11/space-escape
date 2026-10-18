// walks the generated prototype graph like a player would (including BACK history)
module.exports = function selftest(page) {
  const frames = page.children.filter((n) => n.type === 'FRAME');
  const idToKey = {};
  frames.forEach((f) => (idToKey[f.id] = f.name.split(' · ')[0]));
  const out = {};
  for (const f of frames) {
    const o = { click: {}, timer: null, lose: null };
    for (const n of [f, ...f.findAll((x) => x.reactions && x.reactions.length)]) {
      for (const r of n.reactions) {
        const a = r.actions[0];
        const to = a.type === 'BACK' ? 'BACK' : idToKey[a.destinationId];
        if (r.trigger.type === 'AFTER_TIMEOUT') {
          if (to === 'lose') o.lose = to;
          else o.timer = to;
        } else o.click[n.name.replace('hotspot / ', '')] = to;
      }
    }
    out[f.name.split(' · ')[0]] = o;
  }
  const play = (script) => {
    let cur = 'title';
    const hist = [];
    const trace = [cur];
    for (const how of script) {
      let nxt = how === 'timer' ? out[cur].timer : out[cur].click[how];
      if (!nxt) return { end: cur, trace: trace.join(' > ') + ' !! no "' + how + '" on ' + cur };
      if (nxt === 'BACK') nxt = hist.pop();
      else hist.push(cur);
      cur = nxt;
      trace.push(cur);
    }
    return { end: cur, trace: trace.join(' > ') };
  };
  const toKeypad = ['wake up', 'locker', 'keycard', 'timer', 'door', 'terminal'];
  const toReactor = [...toKeypad, 'key 1', 'key 6', 'timer', 'airlock'];
  const toPod = [...toReactor, 'switch 2', 'switch 1', 'switch 3'];
  const solution = [...toPod, 'launch panel', 'port 1', 'port 2', 'port 0', 'launch', 'timer', 'timer', 'timer', 'timer', 'timer'];
  const cases = [
    ['solution reaches win', solution, 'win'],
    ['about page returns to win', [...solution, 'about', 'close'], 'win'],
    ['quarters hint returns', ['wake up', 'hint', 'close'], 'q1'],
    ['bunk log returns', ['wake up', 'bunk', 'close'], 'q1'],
    ['porthole returns', ['wake up', 'porthole', 'close'], 'q1'],
    ['control hint returns', ['wake up', 'locker', 'keycard', 'timer', 'door', 'hint', 'close'], 'c1'],
    ['captain log returns', ['wake up', 'locker', 'keycard', 'timer', 'door', 'captain log', 'close'], 'c1'],
    ['keycard flies to inventory', ['wake up', 'locker', 'keycard', 'timer'], 'q3'],
    ['reactor hint returns', [...toReactor, 'hint', 'close'], 'rp0'],
    ['pod hint returns', [...toPod, 'hint', 'close'], 'p1'],
    ['wrong first digit resets', [...toKeypad, 'key 3', 'key 6', 'timer'], 'k0'],
    ['wrong second digit resets', [...toKeypad, 'key 1', 'key 7', 'timer'], 'k0'],
    ['wrong switch resets reactor', [...toReactor, 'switch 1', 'timer'], 'rp0'],
    ['wrong wire resets', [...toPod, 'launch panel', 'port 0', 'timer'], 'w0'],
    ['door locked without card', ['wake up', 'door'], 'q1d'],
    ['manual keeps wiring progress', [...toPod, 'launch panel', 'port 1', 'manual button', 'close'], 'w1'],
    ['try again restarts', ['wake up'], 'q1'],
  ];
  const results = cases.map(([name, script, want]) => {
    const r = play(script);
    return { name, ok: r.end === want, got: r.end, want };
  });
  const idle = Object.keys(out).filter((k) => !['title', 'win', 'lose', 'about', 'diary', 'porthole', 'poster', 'whiteboard', 'manual', 'ctab', 'q2grab', 'hq', 'hc', 'hp', 'hr', 'kdeny', 'kok', 'wshort', 'rpx', 'l3', 'l2', 'l1', 'la', 'lb'].includes(k) && !out[k].lose);
  return { results, framesWithoutOxygenTimer: idle };
};
