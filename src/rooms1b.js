// poster close-up
function buildPoster() {
  const f = mk('poster', '04 / Crew roster (close-up)', 3, 1);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#1a2a47'], [1, '#04070d']]), name: 'backdrop' });
  rect(f, 380, 60, 680, 790, { fill: '#000000', op: 0.5, r: 10, fx: [shadow(20, 60, 0.8)], name: 'shadow' });
  rect(f, 370, 50, 680, 790, { fill: '#e8f0f8', r: 10, name: 'paper' });
  rect(f, 370, 50, 680, 110, { fill: '#1b6dff', r: 10, name: 'header' });
  text(f, 370, 50, 'STATION OMEGA-7', { font: 'mono', size: 15, fill: '#bcd6ff', ls: 6, w: 680, align: 'CENTER', lh: 60, name: 'sub' });
  text(f, 370, 88, 'CREW ROSTER', { font: 'title', size: 44, fill: C.white, ls: 4, w: 680, align: 'CENTER', name: 'head' });
  const names = ['M. OKAFOR', 'T. VASQUEZ', 'J. LINDQVIST', 'A. NAKAMURA', 'R. PETROV', 'S. ADEYEMI', 'K. HALVORSEN', 'L. FONTAINE'];
  names.forEach((n, i) => {
    const y = 200 + i * 52;
    rect(f, 410, y, 600, 44, { fill: i % 2 ? '#dbe6f1' : '#e8f0f8', r: 6, name: 'row' });
    text(f, 424, y, 'BUNK 0' + (i + 1), { font: 'mono', size: 15, fill: '#4a628c', ls: 2, lh: 44, w: 130, name: 'bunk' });
    text(f, 570, y, n, { font: 'bold', size: 18, fill: '#1b2a44', lh: 44, w: 300, name: 'name' });
    ellipse(f, 960, y + 14, 16, 16, { fill: '#17b26a', name: 'present' });
  });
  // stamp
  rect(f, 410, 640, 600, 3, { fill: '#9fb4d2', name: 'rule' });
  text(f, 410, 660, 'ASSIGNED TO THIS STATION', { font: 'mono', size: 16, fill: '#4a628c', ls: 3, name: 'label' });
  text(f, 410, 690, '8 / 8', { font: 'title', size: 96, fill: '#1b2a44', name: 'count' });
  text(f, 640, 704, 'CREW ABOARD\nALL ACCOUNTED FOR.', { font: 'mono', size: 18, lh: 28, fill: '#c0392b', name: 'stamp' }).rotation = -4;
  fx(f);
  closeBtn(f, 1090, 56, 'BACK');
}

// ---- CONTROL ROOM ----------------------------------------------------------
function drawWindow(f) {
  rect(f, 340, 90, 680, 340, { fill: '#0a111f', stroke: '#3a5282', sw: 6, r: 14, fx: [shadow(14, 30, 0.6)], name: 'window frame' });
  const v = frame(f, 356, 106, 648, 308, { name: 'window view' });
  v.cornerRadius = 8;
  v.fills = [solid('#02040a')];
  drawStars(v, 21, 60, 0, 0, 648, 308);
  drawPlanet(v, 250, 70, 520);
  rect(f, 676, 100, 8, 320, { fill: '#1b2a44', name: 'mullion' });
  rect(f, 350, 252, 660, 8, { fill: '#1b2a44', name: 'mullion' });
  path(f, 356, 106, 'M 0 0 L 300 0 L 120 308 L 0 308 Z', { fill: linear([[0, '#ffffff', 0.08], [1, '#ffffff', 0]], 0), name: 'glass glare' });
}

function drawAirlock(f, open) {
  rect(f, 50, 236, 270, 436, { fill: '#0a111f', r: 14, fx: [shadow(10, 26, 0.6)], name: 'airlock frame' });
  hazardStripe(f, 50, 236, 270, 16);
  rect(f, 64, 262, 242, 400, { fill: linear([[0, '#2b3d5e'], [1, '#17243d']], 90), stroke: '#4a628c', sw: 1.5, r: 10, name: 'airlock door' });
  if (open) {
    rect(f, 92, 296, 186, 340, { fill: linear([[0, '#052a1a'], [1, '#00160d']], 90), r: 8, name: 'opening' });
    rect(f, 92, 296, 186, 340, { fill: radial([[0, C.green, 0.45], [1, C.green, 0]]), name: 'opening glow' });
    rect(f, 92, 296, 40, 340, { fill: '#2b3d5e', r: 6, name: 'door slid' });
    text(f, 92, 450, 'AIRLOCK 03\nOPEN', { font: 'head', size: 20, lh: 30, fill: C.green, w: 186, align: 'CENTER', ls: 2, fx: [glow(C.green, 14, 0.8)], name: 'status' });
  } else {
    ellipse(f, 94, 316, 182, 182, { fill: '#0d1626', stroke: '#5b7299', sw: 10, name: 'hatch' });
    ellipse(f, 124, 346, 122, 122, { stroke: '#3a5282', sw: 4, name: 'hatch inner' });
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      line(f, 185 - Math.cos(a) * 56, 407 - Math.sin(a) * 56, 185 + Math.cos(a) * 56, 407 + Math.sin(a) * 56, { stroke: '#7d93b8', sw: 8, name: 'spoke' });
    }
    ellipse(f, 172, 394, 26, 26, { fill: '#9fb4d2', name: 'wheel hub' });
    text(f, 64, 540, 'SEALED', { font: 'head', size: 22, fill: C.red, ls: 6, w: 242, align: 'CENTER', fx: [glow(C.red, 14, 0.8)], name: 'status' });
    text(f, 64, 584, 'EVA ONLY · CODE REQUIRED', { font: 'mono', size: 11, fill: C.dim, ls: 2, w: 242, align: 'CENTER', name: 'sub' });
  }
  const col = open ? C.green : C.red;
  ellipse(f, 175, 268, 20, 20, { fill: col, fx: [glow(col, 22, 1)], name: 'lamp' });
}

function drawDeckSign(f) {
  rect(f, 70, 150, 230, 62, { fill: '#1a1405', stroke: C.amber, sw: 2, r: 8, fx: [glow(C.amber, 20, 0.35)], name: 'deck sign' });
  text(f, 70, 150, 'DECK 07', { font: 'title', size: 36, fill: '#ffc94d', ls: 4, w: 230, align: 'CENTER', lh: 62, fx: [glow(C.amber, 12, 0.7)], name: 'deck text' });
}

function drawConsole(f, open) {
  rect(f, 320, 536, 720, 130, { fill: linear([[0, '#243350'], [1, '#0f182b']], 90), stroke: '#3a5282', sw: 1.5, r: 12, fx: [shadow(12, 24, 0.6)], name: 'console' });
  rect(f, 320, 524, 720, 24, { fill: '#33466a', r: 10, name: 'console top' });
  const r = rng(5);
  for (let i = 0; i < 30; i++) {
    const colr = r() < 0.2 ? C.amber : r() < 0.3 ? C.cyanDim : '#1b2a44';
    ellipse(f, 346 + (i % 15) * 46, 580 + Math.floor(i / 15) * 34, 14, 14, { fill: colr, op: 0.9, name: 'led' });
  }
  // dead monitors
  [[350, 396], [872, 396]].forEach(([mx, my]) => {
    rect(f, mx, my, 160, 118, { fill: '#05080f', stroke: '#2b3d5e', sw: 3, r: 8, name: 'dead monitor' });
    path(f, mx + 10, my + 10, 'M 0 0 L 70 0 L 20 98 L 0 98 Z', { fill: '#ffffff', op: 0.05, name: 'reflection' });
    path(f, mx, my, 'M 100 20 L 118 52 L 104 70 L 130 108', { stroke: '#2b3d5e', sw: 2, name: 'crack' });
  });
  // live terminal
  const col = open ? C.green : C.cyan;
  rect(f, 548, 366, 272, 176, { fill: '#031017', stroke: col, sw: 3, r: 12, fx: [glow(col, 36, 0.5)], name: 'terminal' });
  rect(f, 560, 378, 248, 152, { fill: radial([[0, col, 0.18], [1, col, 0.02]]), r: 6, name: 'terminal glow' });
  const lines = open ? ['> AIRLOCK 03', '> SEAL RELEASED', '> PIN OK', '> _'] : ['> AIRLOCK 03', '> STATUS: SEALED', '> PIN REQUIRED', '> _'];
  lines.forEach((ln, i) => text(f, 574, 392 + i * 30, ln, { font: 'mono', size: 17, fill: col, name: 'term line' }));
  rect(f, 664, 540, 40, 22, { fill: '#243350', name: 'stand' });
  if (!open) pulse(f, 790, 392, C.cyan);
}

function drawWhiteboard(f) {
  rect(f, 1084, 164, 312, 212, { fill: '#000000', op: 0.45, r: 8, name: 'board shadow' });
  rect(f, 1076, 156, 312, 212, { fill: '#e9f0f7', stroke: '#9fb4d2', sw: 6, r: 8, name: 'whiteboard' });
  text(f, 1090, 168, 'PIN = ?', { font: 'mono', size: 20, fill: '#1b3a8a', name: 'scribble' });
  path(f, 1096, 214, 'M 0 20 Q 60 -4 130 18 Q 190 40 250 12', { stroke: '#c0392b', sw: 3, name: 'scribble line' });
  path(f, 1100, 270, 'M 0 0 L 40 30 M 40 0 L 0 30', { stroke: '#1b3a8a', sw: 3, name: 'x mark' });
  ellipse(f, 1250, 270, 70, 70, { stroke: '#8c5a2b', sw: 5, op: 0.5, name: 'coffee ring' });
  rect(f, 1090, 380, 120, 10, { fill: '#7d93b8', r: 5, name: 'marker tray' });
}

function drawSideConsole(f) {
  rect(f, 1076, 520, 320, 146, { fill: linear([[0, '#243350'], [1, '#0f182b']], 90), stroke: '#3a5282', sw: 1.5, r: 12, name: 'side console' });
  for (let i = 0; i < 3; i++) rect(f, 1096 + i * 100, 540, 84, 54, { fill: '#05080f', stroke: '#2b3d5e', sw: 2, r: 6, name: 'dead screen' });
  for (let i = 0; i < 12; i++) ellipse(f, 1100 + i * 24, 620, 12, 12, { fill: i % 4 === 0 ? C.amber : '#1b2a44', name: 'led' });
}

function buildControl(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  wallPanels(f, 0, 666);
  floorTiles(f, 666);
  ceilingLight(f, 600, 240, s.open ? '#3dff9a' : '#27d3ff', 0.12);
  drawWindow(f);
  drawAirlock(f, s.open);
  drawDeckSign(f);
  drawConsole(f, s.open);
  drawWhiteboard(f);
  drawSideConsole(f);
  fx(f);
  hud(f, 'CONTROL ROOM', 11, true);
  toast(f, s.toast, s.tone);

  go(hotspot(f, 1060, 140, 340, 260, 'whiteboard'), 'whiteboard', { d: 0.3 });
  if (!s.open) {
    go(hotspot(f, 536, 354, 300, 200, 'terminal'), 'k0', { d: 0.3 });
    go(hotspot(f, 50, 236, 270, 436, 'airlock'), 'c1a');
  } else {
    go(hotspot(f, 50, 236, 270, 436, 'airlock'), 'p1', { t: 'PUSH', dir: 'LEFT', d: 0.7, ease: 'EASE_IN_AND_OUT' });
  }
  lungs(f);
  return f;
}

function buildAllControl() {
  buildControl('c1', '05 / Control room', 0, 4, { open: false, toast: 'Dead consoles. One terminal still has power.' });
  buildControl('c1a', '05 / Control room · airlock', 1, 4, { open: false, toast: 'Airlock sealed. The terminal must control it.', tone: 'bad' });
  buildControl('c2', '08 / Control room · airlock open', 2, 4, { open: true, toast: 'ACCESS GRANTED — airlock seal released.', tone: 'good' });
}

function buildWhiteboard() {
  const f = mk('whiteboard', '06 / Whiteboard (close-up)', 3, 4);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#1a2a47'], [1, '#04070d']]), name: 'backdrop' });
  rect(f, 170, 160, 1100, 600, { fill: '#000000', op: 0.5, r: 16, fx: [shadow(24, 60, 0.8)], name: 'shadow' });
  rect(f, 160, 150, 1100, 600, { fill: '#eef4fa', stroke: '#8fa6c4', sw: 14, r: 16, name: 'board' });
  text(f, 220, 190, 'AIRLOCK 03 — NEW PIN', { font: 'mono', size: 30, fill: '#1b3a8a', ls: 2, name: 'h' });
  path(f, 220, 250, 'M 0 0 L 960 0', { stroke: '#1b3a8a', sw: 3, name: 'underline' });
  text(f, 220, 300, 'PIN  =  CREW  ×  DECK', { font: 'title', size: 62, fill: '#c0392b', ls: 2, name: 'formula' });
  text(f, 220, 420, 'Changed it AGAIN. Do NOT write it on your hand, Marcus.\nIf you can\'t remember, count the heads on the roster\nand look at the sign.', {
    font: 'mono', size: 26, lh: 40, fill: '#1b3a8a', name: 'note',
  });
  path(f, 220, 610, 'M 0 20 Q 120 -10 260 20 Q 390 50 520 20', { stroke: '#c0392b', sw: 5, name: 'squiggle' });
  ellipse(f, 1000, 520, 150, 150, { stroke: '#8c5a2b', sw: 9, op: 0.45, name: 'coffee ring' });
  text(f, 940, 640, '☕ ☠', { font: 'bold', size: 40, fill: '#1b3a8a', op: 0.7, name: 'doodle' });
  fx(f);
  closeBtn(f, 1230, 96, 'BACK');
}
