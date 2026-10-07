// ---- keypad, pod bay, wiring puzzle, launch, endings ------------------------

function symbol(f, kind, cx, cy, s, col) {
  if (kind === 'circle') ellipse(f, cx - s / 2, cy - s / 2, s, s, { fill: col, fx: [glow(col, 10, 0.6)], name: 'sym circle' });
  else if (kind === 'tri')
    path(f, cx - s / 2, cy - s / 2, 'M ' + s / 2 + ' 0 L ' + s + ' ' + s + ' L 0 ' + s + ' Z', { fill: col, fx: [glow(col, 10, 0.6)], name: 'sym triangle' });
  else rect(f, cx - s / 2, cy - s / 2, s, s, { fill: col, r: 4, fx: [glow(col, 10, 0.6)], name: 'sym square' });
}

// ---- KEYPAD ----------------------------------------------------------------
function buildKeypad(key, name, col, row, st) {
  const f = mk(key, name, col, row);
  const bad = st === 'deny';
  const good = st === 'ok';
  const tone = good ? C.green : bad ? C.red : C.cyan;
  rect(f, 0, 0, W, H, { fill: radial([[0, '#13233f'], [1, '#03060b']]), name: 'backdrop' });
  rect(f, 400, 70, 640, 760, {
    fill: linear([[0, '#24344f'], [1, '#0c1424']], 90),
    stroke: '#4a628c',
    sw: 2,
    r: 32,
    fx: [shadow(24, 60, 0.8), glow(tone, 50, 0.2)],
    name: 'terminal body',
  });
  rect(f, 420, 90, 600, 720, { fill: '#050b14', r: 22, name: 'bezel inner' });
  text(f, 420, 116, 'AIRLOCK 03  ·  PIN ENTRY', { font: 'mono', size: 15, fill: C.dim, ls: 4, w: 600, align: 'CENTER', name: 'header' });
  rect(f, 480, 170, 480, 110, { fill: '#02090f', stroke: tone, sw: 2, r: 14, fx: [glow(tone, 26, 0.4)], name: 'display' });
  const shown = good ? 'ACCESS GRANTED' : bad ? 'ACCESS DENIED' : st === 'k0' ? '_   _' : '●   _';
  text(f, 480, 170, shown, {
    font: 'head',
    size: good || bad ? 32 : 58,
    fill: tone,
    ls: good || bad ? 3 : 8,
    w: 480,
    align: 'CENTER',
    lh: 110,
    fx: [glow(tone, 16, 0.8)],
    name: 'display text',
  });
  const sub = good ? 'SEAL RELEASED' : bad ? 'WRONG PIN · RESETTING' : 'ENTER THE 2-DIGIT PIN';
  text(f, 420, 298, sub, { font: 'mono', size: 14, fill: bad ? C.red : C.dim, ls: 4, w: 600, align: 'CENTER', name: 'sub' });

  const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['CLR', '0', '']];
  rows.forEach((r, ri) =>
    r.forEach((label, ci) => {
      if (!label) return;
      const x = 541 + ci * 124;
      const y = 350 + ri * 84;
      rect(f, x, y, 110, 70, { fill: linear([[0, '#1f3050'], [1, '#101a2e']], 90), stroke: '#34507d', sw: 1.5, r: 14, fx: [shadow(4, 8, 0.5)], name: 'key ' + label });
      text(f, x, y, label, { font: 'head', size: label === 'CLR' ? 16 : 28, fill: label === 'CLR' ? C.amber : C.white, w: 110, align: 'CENTER', lh: 70, ls: label === 'CLR' ? 2 : 0, name: 'key label' });
    })
  );
  text(f, 420, 716, 'MAINTENANCE TERMINAL  ·  AUTH REQUIRED', { font: 'mono', size: 12, fill: C.dim, ls: 3, w: 600, align: 'CENTER', op: 0.7, name: 'footer' });
  fx(f, bad);

  if (st === 'k0' || st === 'k5' || st === 'kx') {
    rows.forEach((r, ri) =>
      r.forEach((label, ci) => {
        if (!label) return;
        const h = hotspot(f, 541 + ci * 124, 350 + ri * 84, 110, 70, 'key ' + label);
        let to;
        if (label === 'CLR') to = 'k0';
        else if (st === 'k0') to = label === '5' ? 'k5' : 'kx';
        else if (st === 'k5') to = label === '6' ? 'kok' : 'kdeny';
        else to = 'kdeny';
        go(h, to, { d: 0.05 });
      })
    );
    closeBtn(f, 960, 100, 'c1');
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

// ---- POD BAY ---------------------------------------------------------------
function drawPodShip(parent, x, y, powered, flame) {
  const g = frame(parent, x, y, 520, 300, { noclip: true, name: 'pod' });
  rect(g, 120, 290, 18, 56, { fill: '#2b3d5e', r: 4, name: 'leg' });
  rect(g, 380, 290, 18, 56, { fill: '#2b3d5e', r: 4, name: 'leg' });
  rect(g, -30, 96, 46, 108, { fill: linear([[0, '#17243d'], [1, '#43587d']], 0), r: 10, name: 'thruster' });
  if (flame) {
    path(g, -300, 110, 'M 300 0 L 0 50 L 300 90 Z', { fill: linear([[0, '#ffffff', 0.95], [0.25, C.amber, 0.8], [1, C.red, 0]], 0), fx: [glow(C.amber, 40, 0.8)], name: 'flame' });
  }
  path(g, 0, 0, 'M 0 90 Q 0 20 100 10 L 300 10 Q 470 20 520 150 Q 470 280 300 290 L 100 290 Q 0 280 0 210 Z', {
    fill: linear([[0, '#e6eef8'], [0.5, '#9fb4d2'], [1, '#3a5282']], 90),
    stroke: '#5b7299',
    sw: 3,
    fx: [shadow(16, 30, 0.6)],
    name: 'hull',
  });
  rect(g, 30, 150, 400, 16, { fill: C.amber, op: 0.9, name: 'stripe' });
  rect(g, 30, 172, 400, 6, { fill: C.red, op: 0.8, name: 'stripe' });
  const wcol = powered ? C.green : C.cyan;
  ellipse(g, 326, 56, 118, 118, { fill: radial([[0, wcol, powered ? 0.6 : 0.28], [1, '#06101c', 1]]), stroke: '#27384f', sw: 9, fx: [glow(wcol, 30, powered ? 0.6 : 0.2)], name: 'window' });
  rect(g, 118, 66, 124, 184, { fill: '#243350', stroke: '#c3d4e6', sw: 4, r: 16, name: 'hatch' });
  rect(g, 214, 140, 12, 44, { fill: '#c3d4e6', r: 5, name: 'hatch handle' });
  ellipse(g, 168, 82, 22, 22, { fill: powered ? C.green : C.red, fx: [glow(powered ? C.green : C.red, 18, 0.9)], name: 'hatch lamp' });
  text(g, 262, 236, 'LIFEBOAT 2', { font: 'mono', size: 13, fill: '#1b2a44', ls: 3, name: 'hull label' });
  return g;
}

function buildPod(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  wallPanels(f, 0, 640);
  floorTiles(f, 640);
  ceilingLight(f, 560, 320, s.powered ? '#3dff9a' : '#ffb020', 0.12);
  rect(f, 930, 110, 450, 450, { fill: '#0a111f', stroke: '#3a5282', sw: 6, r: 20, fx: [shadow(14, 30, 0.6)], name: 'bay window frame' });
  const v = frame(f, 946, 126, 418, 418, { name: 'bay view' });
  v.cornerRadius = 12;
  v.fills = [solid('#02040a')];
  drawStars(v, 31, 70, 0, 0, 418, 418);
  drawPlanet(v, 120, 160, 420);
  hazardStripe(f, 0, 640, W, 22);
  drawPodShip(f, 400, 290, s.powered, false);

  rect(f, 110, 330, 240, 230, { fill: linear([[0, '#243350'], [1, '#0f182b']], 90), stroke: '#3a5282', sw: 2, r: 16, fx: [shadow(10, 20, 0.6)], name: 'launch panel' });
  const sc = s.powered ? C.green : C.red;
  rect(f, 128, 348, 204, 110, { fill: '#031017', stroke: sc, sw: 2, r: 10, fx: [glow(sc, 22, 0.4)], name: 'panel screen' });
  text(f, 128, 348, s.powered ? 'POD READY' : 'NO POWER\nWIRES UNPLUGGED', { font: 'mono', size: 17, lh: 28, fill: sc, w: 204, align: 'CENTER', name: 'panel text' });
  if (s.powered) {
    rect(f, 140, 478, 180, 56, { fill: C.green, r: 28, fx: [glow(C.green, 26, 0.7)], name: 'launch button' });
    text(f, 140, 478, 'LAUNCH', { font: 'head', size: 20, fill: '#02140b', ls: 4, w: 180, align: 'CENTER', lh: 56, name: 'launch label' });
  } else {
    for (let i = 0; i < 3; i++) ellipse(f, 150 + i * 56, 490, 28, 28, { fill: '#1b2a44', stroke: '#3a5282', sw: 2, name: 'dead port' });
    pulse(f, 178, 504, C.amber);
  }
  const m = frame(f, 150, 150, 170, 130, { noclip: true, fill: '#dfe9f3', r: 4, fx: [shadow(8, 14, 0.6)], name: 'manual' });
  m.rotation = -3;
  rect(m, 0, 0, 170, 34, { fill: '#c0392b', r: 4, name: 'manual head' });
  text(m, 0, 0, 'POD MANUAL', { font: 'head', size: 15, fill: C.white, ls: 2, w: 170, align: 'CENTER', lh: 34, name: 'manual title' });
  for (let i = 0; i < 5; i++) rect(m, 14, 50 + i * 15, 142 - (i % 2) * 40, 6, { fill: '#9fb4d2', r: 3, name: 'line' });

  fx(f);
  hud(f, 'ESCAPE POD BAY', 5, true);
  toast(f, s.toast, s.tone);
  go(hotspot(f, 140, 140, 190, 160, 'manual'), 'manual', { d: 0.3 });
  if (s.powered) {
    go(hotspot(f, 140, 478, 180, 56, 'launch'), 'l3', { d: 0.3 });
    go(hotspot(f, 510, 340, 150, 210, 'hatch'), 'l3', { d: 0.3 });
  } else {
    go(hotspot(f, 110, 330, 240, 230, 'launch panel'), 'w0', { d: 0.3 });
    go(hotspot(f, 510, 340, 150, 210, 'hatch'), 'p1h');
  }
  lungs(f);
}

function buildAllPod() {
  buildPod('p1', '09 / Pod bay', 0, 6, { powered: false, toast: 'The pod is here, but its panel is dead. Three wires hang loose.' });
  buildPod('p1h', '09 / Pod bay · hatch', 1, 6, { powered: false, toast: 'Hatch is sealed. There is no power to the pod.', tone: 'bad' });
  buildPod('p2', '12 / Pod bay · powered', 2, 6, { powered: true, toast: 'ALL SYSTEMS ONLINE. Launch when ready.', tone: 'good' });
}

// ---- MANUAL + WIRES --------------------------------------------------------
const WIRES = [
  { name: 'RED', col: '#ff3b4e', port: 1 },
  { name: 'BLUE', col: '#3b9bff', port: 2 },
  { name: 'YELLOW', col: '#ffd23b', port: 0 },
];
const PORT_SYM = ['circle', 'tri', 'square'];

function buildManual() {
  const f = mk('manual', '10 / Pod manual (close-up)', 3, 6);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#1a2a47'], [1, '#04070d']]), name: 'backdrop' });
  rect(f, 330, 70, 780, 780, { fill: '#000000', op: 0.5, r: 12, fx: [shadow(24, 60, 0.8)], name: 'shadow' });
  rect(f, 320, 60, 780, 780, { fill: '#e8f0f8', r: 12, name: 'paper' });
  rect(f, 320, 60, 780, 120, { fill: '#c0392b', r: 12, name: 'header' });
  text(f, 320, 80, 'LIFEBOAT 2', { font: 'mono', size: 15, fill: '#ffd6d0', ls: 8, w: 780, align: 'CENTER', name: 'sub' });
  text(f, 320, 108, 'EMERGENCY WIRING', { font: 'title', size: 44, fill: C.white, ls: 3, w: 780, align: 'CENTER', name: 'head' });
  WIRES.forEach((w, i) => {
    const y = 250 + i * 160;
    rect(f, 380, y, 150, 80, { fill: w.col, r: 14, name: 'wire ' + w.name });
    text(f, 380, y, w.name, { font: 'head', size: 20, fill: '#10131c', ls: 3, w: 150, align: 'CENTER', lh: 80, name: 'wire label' });
    curve(f, 530, y + 40, 880, y + 40, { stroke: w.col, sw: 8, cap: 'ROUND', name: 'run' });
    rect(f, 880, y, 130, 80, { fill: '#1b2a44', r: 14, name: 'port plate' });
    symbol(f, PORT_SYM[w.port], 945, y + 40, 34, '#e8f0f8');
  });
  text(f, 380, 740, 'CROSS A WIRE AND THE POD SHORTS OUT.\nCONNECT IN THE ORDER SHOWN: RED, BLUE, YELLOW.', { font: 'mono', size: 15, lh: 24, fill: '#c0392b', ls: 1, name: 'warning' });
  fx(f);
  closeBtn(f, 1060, 76, 'BACK');
}

function buildWire(key, name, col, row, st) {
  const f = mk(key, name, col, row);
  const short = st === 'short';
  const active = short ? 0 : st;
  rect(f, 0, 0, W, H, { fill: radial([[0, '#12203a'], [1, '#03060b']]), name: 'backdrop' });
  rect(f, 180, 100, 1080, 700, { fill: linear([[0, '#1d2d4b'], [1, '#0b1322']], 90), stroke: '#4a628c', sw: 2, r: 28, fx: [shadow(24, 60, 0.8)], name: 'panel' });
  hazardStripe(f, 200, 118, 1040, 14);
  text(f, 230, 150, 'POD POWER  ·  MANUAL WIRING', { font: 'mono', size: 15, fill: C.dim, ls: 4, name: 'title' });
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
    rect(f, 1050, y, 160, 90, { fill: '#07101c', stroke: used ? C.green : '#4a628c', sw: 2, r: 16, fx: used ? [glow(C.green, 18, 0.5)] : [], name: 'port ' + p });
    symbol(f, PORT_SYM[p], 1130, y + 45, 34, used ? C.green : '#e8f4ff');
  });

  pill(f, 230, 716, 230, 48, 'OPEN MANUAL', C.cyan, false);
  fx(f, short);
  if (short) toast(f, 'Wrong port. Sparks everywhere. Start over.', 'bad');

  go(hotspot(f, 230, 716, 230, 48, 'manual button'), 'manual', { d: 0.25 });
  if (!short) {
    portY.forEach((y, p) => {
      const ok = p === WIRES[st].port;
      go(hotspot(f, 1040, y - 10, 180, 110, 'port ' + p), ok ? (st === 2 ? 'p2' : 'w' + (st + 1)) : 'wshort', { d: ok ? 0.25 : 0.08 });
    });
    closeBtn(f, 1190, 118, 'p1');
    lungs(f);
  } else after(f, 1.3, 'w0', { d: 0.2 });
}

function buildAllWires() {
  buildManual();
  buildWire('w0', '11 / Wiring · red', 0, 7, 0);
  buildWire('w1', '11 / Wiring · blue', 1, 7, 1);
  buildWire('w2', '11 / Wiring · yellow', 2, 7, 2);
  buildWire('wshort', '11 / Wiring · short circuit', 3, 7, 'short');
}

// ---- LAUNCH + ENDINGS ------------------------------------------------------
function buildCountdown(key, name, col, n) {
  const f = mk(key, name, col, 8);
  bgSpace(f);
  drawPlanet(f, 760, 330, 900);
  drawPodShip(f, 120, 300, true, false);
  rect(f, 0, 0, W, H, { fill: '#000000', op: 0.35, name: 'dim' });
  text(f, 0, 150, 'LAUNCH IN', { font: 'mono', size: 20, fill: C.dim, ls: 12, w: W, align: 'CENTER', name: 'label' });
  text(f, 0, 190, String(n), { font: 'title', size: 340, fill: n === 1 ? C.red : C.cyan, w: W, align: 'CENTER', fx: [glow(n === 1 ? C.red : C.cyan, 60, 0.5)], name: 'count' });
  fx(f, n === 1);
  after(f, 0.9, n === 1 ? 'la' : n === 3 ? 'l2' : 'l1', { d: 0.1 });
}

function buildLaunch(key, name, col, gone) {
  const f = mk(key, name, col, 8);
  bgSpace(f);
  drawPlanet(f, 760, 330, 900);
  if (gone) {
    for (let i = 0; i < 14; i++) rect(f, 100 + i * 90, 120 + ((i * 137) % 640), 300 + (i % 4) * 90, 2, { fill: C.white, op: 0.25 + (i % 3) * 0.12, name: 'speed line' });
  }
  drawPodShip(f, gone ? 1500 : 120, 300, true, true);
  fx(f);
  after(f, gone ? 0.3 : 0.25, gone ? 'win' : 'lb', gone ? { d: 0.9 } : { t: 'SMART_ANIMATE', d: 1.7, ease: 'EASE_IN' });
}

function buildWin() {
  const f = mk('win', '13 / You made it', 1, 0);
  bgSpace(f);
  drawPlanet(f, 300, 560, 1100);
  text(f, 0, 190, 'ESCAPE SUCCESSFUL', { font: 'mono', size: 18, fill: C.green, ls: 10, w: W, align: 'CENTER', name: 'eyebrow' });
  text(f, 0, 230, 'YOU MADE IT.', { font: 'title', size: 150, fill: C.white, ls: 4, w: W, align: 'CENTER', fx: [glow(C.green, 50, 0.35)], name: 'title' });
  text(f, 0, 420, 'Station Omega-7 came apart four minutes later.\nYou were the only survivor.', { font: 'body', size: 28, lh: 42, fill: C.dim, w: W, align: 'CENTER', name: 'epilogue' });
  pill(f, 560, 560, 320, 76, 'PLAY AGAIN', C.green, true);
  text(f, 0, 840, 'built in figma  ·  made with code  ·  the wrong tool', { font: 'mono', size: 13, fill: C.dim, ls: 4, w: W, align: 'CENTER', name: 'credit' });
  fx(f);
  go(hotspot(f, 560, 560, 320, 76, 'play again'), 'title', { d: 0.6 });
}

function buildLose() {
  const f = mk('lose', '14 / Oxygen depleted', 2, 0);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#2a0a10'], [1, '#050205']]), name: 'backdrop' });
  text(f, 0, 270, 'O2  0%', { font: 'mono', size: 18, fill: C.red, ls: 10, w: W, align: 'CENTER', name: 'eyebrow' });
  text(f, 0, 310, 'OXYGEN DEPLETED', { font: 'title', size: 110, fill: C.red, ls: 4, w: W, align: 'CENTER', fx: [glow(C.red, 50, 0.5)], name: 'title' });
  text(f, 0, 460, 'You stopped moving. The station did not.', { font: 'body', size: 28, fill: C.dim, w: W, align: 'CENTER', name: 'sub' });
  pill(f, 560, 560, 320, 76, 'TRY AGAIN', C.red, true);
  fx(f, true);
  go(hotspot(f, 560, 560, 320, 76, 'try again'), 'q1', { d: 0.6 });
}

function buildAllEnd() {
  buildCountdown('l3', '12 / Launch · 3', 0, 3);
  buildCountdown('l2', '12 / Launch · 2', 1, 2);
  buildCountdown('l1', '12 / Launch · 1', 2, 1);
  buildLaunch('la', '12 / Launch · liftoff', 3, false);
  buildLaunch('lb', '12 / Launch · gone', 4, true);
  buildWin();
  buildLose();
}
