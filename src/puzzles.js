// ---- the puzzles: airlock keypad, pod wiring, reactor switches -------------------

function symbol(f, kind, cx, cy, s, col) {
  if (kind === 'circle') ellipse(f, cx - s / 2, cy - s / 2, s, s, { fill: col, fx: [glow(col, 10, 0.6)], name: 'sym circle' });
  else if (kind === 'tri') path(f, cx - s / 2, cy - s / 2, 'M ' + s / 2 + ' 0 L ' + s + ' ' + s + ' L 0 ' + s + ' Z', { fill: col, fx: [glow(col, 10, 0.6)], name: 'sym triangle' });
  else rect(f, cx - s / 2, cy - s / 2, s, s, { fill: col, r: 4, fx: [glow(col, 10, 0.6)], name: 'sym square' });
}

function innerShadow(y, radius, alpha) {
  return { type: 'INNER_SHADOW', color: { r: 1, g: 1, b: 1, a: alpha }, offset: { x: 0, y }, radius, spread: 0, visible: true, blendMode: 'NORMAL' };
}

// ---- KEYPAD ----------------------------------------------------------------------
function buildKeypad(key, name, col, row, st) {
  const f = mk(key, name, col, row);
  const bad = st === 'deny';
  const good = st === 'ok';
  const tone = good ? C.green : bad ? C.red : C.cyan;
  zoomBg(f, 'control_sealed', REGIONS.control_sealed.terminal, 2.8, 18);
  dim(f, 0.55, bad ? '#2a0508' : '#02050b');
  glass(f, 400, 70, 640, 760, { r: 32, op: 0.74, blur: 24, stroke: tone, strokeOp: 0.55, glow: tone, glowA: 0.22, glowR: 50, name: 'terminal body' });
  rect(f, 424, 94, 592, 712, { fill: '#050b14', op: 0.55, r: 22, name: 'bezel inner' });
  text(f, 420, 116, 'AIRLOCK 03  ·  PIN ENTRY', { font: 'mono', size: 15, fill: '#a9c3e6', ls: 4, w: 600, align: 'CENTER', name: 'header' });
  rect(f, 480, 170, 480, 110, { fill: '#02090f', stroke: tone, sw: 2, r: 14, fx: [glow(tone, 26, 0.4), innerShadow(4, 14, 0.12)], name: 'display' });
  const slots = !good && !bad;
  if (slots) {
    for (let i = 0; i < 2; i++) {
      const filled = i === 0 && st !== 'k0';
      ellipse(f, 720 + (i ? 52 : -52) - 18, 225 - 18, 36, 36, filled ? { fill: tone, fx: [glow(tone, 16, 0.8)], name: 'digit slot ' + i } : { stroke: tone, sw: 3, op: 0.7, name: 'digit slot ' + i });
    }
  }
  const shown = good ? 'ACCESS GRANTED' : bad ? 'ACCESS DENIED' : '';
  if (shown) text(f, 480, 170, shown, { font: 'head', size: 32, fill: tone, ls: 3, w: 480, align: 'CENTER', lh: 110, fx: [glow(tone, 16, 0.8)], name: 'display text' });
  const sub = good ? 'SEAL RELEASED' : bad ? 'WRONG PIN · RESETTING' : 'ENTER THE 2-DIGIT PIN';
  text(f, 420, 298, sub, { font: 'mono', size: 14, fill: bad ? C.red : '#a9c3e6', ls: 4, w: 600, align: 'CENTER', name: 'sub' });

  const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['CLR', '0', '']];
  rows.forEach((r, ri) =>
    r.forEach((label, ci) => {
      if (!label) return;
      const x = 541 + ci * 124;
      const y = 350 + ri * 84;
      rect(f, x, y, 110, 70, {
        fill: linear([[0, '#2c4572'], [1, '#101a30']], 90),
        stroke: '#6f95d6',
        sw: 1.5,
        r: 16,
        fx: [shadow(8, 12, 0.6), innerShadow(2, 3, 0.35)],
        name: 'key ' + label,
      });
      rect(f, x + 4, y + 4, 102, 26, { fill: linear([[0, '#ffffff', 0.22], [1, '#ffffff', 0]], 90), r: 13, name: 'key sheen' });
      text(f, x, y, label, { font: 'head', size: label === 'CLR' ? 16 : 28, fill: label === 'CLR' ? C.amber : C.white, w: 110, align: 'CENTER', lh: 70, ls: label === 'CLR' ? 2 : 0, name: 'key label' });
    })
  );
  text(f, 420, 716, 'MAINTENANCE TERMINAL  ·  AUTH REQUIRED', { font: 'mono', size: 12, fill: '#a9c3e6', ls: 3, w: 600, align: 'CENTER', op: 0.7, name: 'footer' });

  if (st === 'k0' || st === 'k5' || st === 'kx') {
    rows.forEach((r, ri) =>
      r.forEach((label, ci) => {
        if (!label) return;
        const h = hotspot(f, 541 + ci * 124, 350 + ri * 84, 110, 70, 'key ' + label);
        let to;
        if (label === 'CLR') to = 'k0';
        else if (st === 'k0') to = label === '1' ? 'k5' : 'kx';
        else if (st === 'k5') to = label === '6' ? 'kok' : 'kdeny';
        else to = 'kdeny';
        go(h, to, MORPH);
      })
    );
    closeBtn(f, 960, 100, 'c1', PUSH);
    lungs(f);
  } else if (bad) after(f, 1.4, 'k0', { d: 0.15 });
  else after(f, 1.6, 'c2', { d: 0.5 });
}

function buildAllKeypad() {
  buildKeypad('k0', '07 / Keypad', 0, 5, 'k0');
  buildKeypad('k5', '07 / Keypad · one digit (right)', 1, 5, 'k5');
  buildKeypad('kx', '07 / Keypad · one digit (wrong)', 2, 5, 'kx');
  buildKeypad('kdeny', '07 / Keypad · denied', 3, 5, 'deny');
  buildKeypad('kok', '07 / Keypad · granted', 4, 5, 'ok');
}

// ---- WIRING ---------------------------------------------------------------------------
const WIRES = [
  { name: 'RED', col: '#ff3b4e', port: 1 },
  { name: 'BLUE', col: '#3b9bff', port: 2 },
  { name: 'YELLOW', col: '#ffd23b', port: 0 },
];
const PORT_SYM = ['circle', 'tri', 'square'];

function buildWire(key, name, col, row, st) {
  const f = mk(key, name, col, row);
  const short = st === 'short';
  const active = short ? 0 : st;
  zoomBg(f, 'pod_dead', REGIONS.pod_dead.panel, 2.0, 18);
  dim(f, short ? 0.5 : 0.55, short ? '#2a0508' : '#02050b');
  glass(f, 180, 100, 1080, 700, { r: 28, op: 0.72, blur: 24, glow: C.cyan, glowA: 0.14, name: 'panel' });
  hazardStripe(f, 200, 118, 1040, 14);
  text(f, 230, 150, 'POD POWER  ·  MANUAL WIRING', { font: 'mono', size: 15, fill: '#a9c3e6', ls: 4, name: 'title' });
  const w0 = WIRES[Math.min(active, 2)];
  const msg = short ? 'SHORT CIRCUIT  ·  RESETTING' : 'CONNECT THE ' + w0.name + ' WIRE';
  const mcol = short ? C.red : w0.col;
  text(f, 230, 186, msg, { font: 'head', size: 30, fill: mcol, ls: 3, fx: [glow(mcol, 18, 0.6)], name: 'instruction' });

  const portY = [250, 430, 610];
  WIRES.forEach((w, i) => {
    const y = 250 + i * 180;
    const done = !short && i < st;
    const isActive = !short && i === st;
    rect(f, 250, y, 80, 90, { fill: w.col, op: isActive || done ? 1 : 0.35, r: 14, fx: isActive ? [glow(w.col, 28, 0.8)] : [], name: 'source ' + w.name });
    text(f, 250, y, w.name.slice(0, 1), { font: 'head', size: 26, fill: '#10131c', w: 80, align: 'CENTER', lh: 90, name: 'source label' });
    if (done) {
      curve(f, 330, y + 45, 1050, portY[w.port] + 45, { stroke: w.col, sw: 10, cap: 'ROUND', fx: [glow(w.col, 14, 0.7)], name: 'wire connected' });
    } else {
      const op = isActive ? 1 : 0.35;
      curve(f, 330, y + 45, 640, y + 62, { stroke: w.col, sw: 10, cap: 'ROUND', op, fx: isActive ? [glow(w.col, 14, 0.7)] : [], name: 'wire loose' });
      rect(f, 640, y + 40, 62, 44, { fill: '#c3d4e6', op, r: 8, name: 'plug' });
      rect(f, 700, y + 48, 18, 10, { fill: '#7d93b8', op, name: 'prong' });
      rect(f, 700, y + 66, 18, 10, { fill: '#7d93b8', op, name: 'prong' });
      if (isActive) text(f, 740, y + 52, '←  ACTIVE', { font: 'mono', size: 15, fill: w.col, ls: 3, name: 'active tag' });
    }
  });
  portY.forEach((y, p) => {
    const used = !short && WIRES.some((w, i) => i < st && w.port === p);
    glass(f, 1050, y, 160, 90, { r: 16, op: 0.7, blur: 10, stroke: used ? C.green : '#9fc4ff', strokeOp: used ? 0.9 : 0.35, glow: used ? C.green : undefined, glowA: 0.4, shadow: false, name: 'port ' + p });
    symbol(f, PORT_SYM[p], 1130, y + 45, 34, used ? C.green : '#e8f4ff');
  });

  pill(f, 230, 716, 230, 48, 'OPEN MANUAL', C.cyan, false);
  go(hotspot(f, 230, 716, 230, 48, 'manual button'), 'manual', { d: 0.25 });
  if (!short) {
    portY.forEach((y, p) => {
      const ok = p === WIRES[st].port;
      go(hotspot(f, 1040, y - 10, 180, 110, 'port ' + p), ok ? (st === 2 ? 'p2' : 'w' + (st + 1)) : 'wshort', ok ? MORPH : { d: 0.08 });
    });
    closeBtn(f, 1190, 118, 'p1', PUSH);
    lungs(f);
  } else after(f, 1.3, 'w0', { d: 0.2 });
}

function buildAllWires() {
  buildWire('w0', '11 / Wiring · red', 0, 7, 0);
  buildWire('w1', '11 / Wiring · blue', 1, 7, 1);
  buildWire('w2', '11 / Wiring · yellow', 2, 7, 2);
  buildWire('wshort', '11 / Wiring · short circuit', 3, 7, 'short');
}

// ---- REACTOR SWITCH PANEL (ACT IV) -------------------------------------------
function buildReactor(key, name, col, row, onSwitches, switchDests) {
  const f = mk(key, name, col, row);
  const error = !switchDests;
  zoomBg(f, 'pod_dead', REGIONS.pod_dead.panel, 1.6, 18);
  dim(f, error ? 0.6 : 0.48, error ? '#2a0508' : '#02050b');
  const panelCol = error ? C.red : C.amber;
  glass(f, 180, 80, 1080, 740, { r: 28, op: 0.72, blur: 24, glow: panelCol, glowA: 0.16, name: 'panel' });
  hazardStripe(f, 200, 98, 1040, 14);
  text(f, 200, 132, 'REACTOR  ·  STARTUP SEQUENCE', { font: 'mono', size: 15, fill: '#a9c3e6', ls: 4, name: 'title' });
  const mcol = error ? C.red : onSwitches.length > 0 ? C.green : C.amber;
  const msg = error ? 'WRONG SEQUENCE  ·  RESETTING' :
    onSwitches.length === 0 ? 'FLIP THE SWITCHES IN ORDER' :
    onSwitches.length === 1 ? 'CORRECT  ·  CONTINUE THE SEQUENCE' : 'ONE MORE  ·  FINAL SWITCH';
  text(f, 200, 168, msg, { font: 'head', size: 28, fill: mcol, ls: 3, fx: [glow(mcol, 18, 0.6)], name: 'msg' });
  const swX = [440, 720, 1000];
  ['1', '2', '3'].forEach((lbl, i) => {
    const x = swX[i];
    const on = onSwitches.includes(i);
    const sc = on ? C.green : '#354258';
    rect(f, x - 50, 280, 100, 340, { fill: '#0c1828', stroke: sc, sw: on ? 3 : 1.5, r: 14, fx: on ? [glow(sc, 22, 0.5)] : [], name: 'sw box ' + lbl });
    ellipse(f, x - 10, 258, 20, 20, { fill: on ? C.green : '#1e2c42', fx: on ? [glow(C.green, 12, 0.9)] : [], name: 'sw light ' + lbl });
    const levY = on ? 440 : 300;
    rect(f, x - 14, levY, 28, 70, { fill: on ? C.green : '#2c3e5a', r: 8, fx: on ? [glow(C.green, 12, 0.7)] : [], name: 'sw lever ' + lbl });
    text(f, x - 50, 646, lbl, { font: 'title', size: 50, fill: on ? C.green : '#506080', w: 100, align: 'CENTER', name: 'sw num ' + lbl });
  });
  if (!error) {
    swX.forEach((x, i) => go(hotspot(f, x - 60, 248, 120, 400, 'switch ' + (i + 1)), switchDests[i], MORPH));
    glass(f, 200, 732, 150, 46, { r: 23, op: 0.5, stroke: C.cyan, strokeOp: 0.5, shadow: false, name: 'hint button' });
    text(f, 200, 732, '?  HINT', { font: 'mono', size: 13, fill: C.cyan, ls: 3, w: 150, align: 'CENTER', lh: 46, name: 'hint label' });
    go(hotspot(f, 196, 728, 158, 54, 'hint'), 'hr', { d: 0.2 });
    closeBtn(f, 1220, 100, 'c2', PUSH);
    lungs(f);
  } else {
    after(f, 1.3, 'rp0', { d: 0.2 });
  }
}

function buildAllReactor() {
  // right order is 2, 1, 3 (bravo alpha charlie from the captain's log)
  buildReactor('rp0', '13 / Reactor · start',   0, 9, [],     ['rpx', 'rp1', 'rpx']);
  buildReactor('rp1', '13 / Reactor · step 1',  1, 9, [1],    ['rp2', 'rpx', 'rpx']);
  buildReactor('rp2', '13 / Reactor · step 2',  2, 9, [1, 0], ['rpx', 'rpx', 'p1']);
  buildReactor('rpx', '13 / Reactor · wrong',   3, 9, [],     null);
}
