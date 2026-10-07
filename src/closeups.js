// ---- close-ups: a camera push-in on the room render, then the readable object ----

function paperShadow(f, x, y, w, h, r) {
  rect(f, x + 12, y + 14, w, h, { fill: '#000000', op: 0.55, r, fx: [{ type: 'LAYER_BLUR', radius: 18, visible: true }], name: 'paper shadow' });
}

function buildPoster() {
  const f = mk('poster', '04 / Crew roster (close-up)', 3, 1);
  zoomBg(f, 'quarters_closed', REGIONS.quarters_closed.poster, 3.4, 10);
  dim(f, 0.5);
  paperShadow(f, 370, 50, 680, 790, 10);
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
  rect(f, 410, 640, 600, 3, { fill: '#9fb4d2', name: 'rule' });
  text(f, 410, 660, 'ASSIGNED TO THIS STATION', { font: 'mono', size: 16, fill: '#4a628c', ls: 3, name: 'label' });
  text(f, 410, 690, '8 / 8', { font: 'title', size: 96, fill: '#1b2a44', name: 'count' });
  text(f, 640, 704, 'CREW ABOARD\nALL ACCOUNTED FOR.', { font: 'mono', size: 18, lh: 28, fill: '#c0392b', name: 'stamp' }).rotation = -4;
  closeBtn(f, 1090, 56, 'BACK');
}

function buildWhiteboard() {
  const f = mk('whiteboard', '06 / Whiteboard (close-up)', 3, 4);
  zoomBg(f, 'control_sealed', REGIONS.control_sealed.whiteboard, 3.6, 10);
  dim(f, 0.5);
  paperShadow(f, 160, 150, 1100, 600, 16);
  rect(f, 160, 150, 1100, 600, { fill: '#eef4fa', stroke: '#8fa6c4', sw: 14, r: 16, name: 'board' });
  text(f, 220, 190, 'AIRLOCK 03 — NEW PIN', { font: 'mono', size: 30, fill: '#1b3a8a', ls: 2, name: 'h' });
  path(f, 220, 250, 'M 0 0 L 960 0', { stroke: '#1b3a8a', sw: 3, name: 'underline' });
  text(f, 220, 300, 'PIN  =  CREW  ×  DECK', { font: 'title', size: 62, fill: '#c0392b', ls: 2, name: 'formula' });
  text(f, 220, 420, "Changed it AGAIN. Do NOT write it on your hand, Marcus.\nIf you can't remember, count the heads on the roster\nand look at the sign.", { font: 'mono', size: 26, lh: 40, fill: '#1b3a8a', name: 'note' });
  path(f, 220, 610, 'M 0 20 Q 120 -10 260 20 Q 390 50 520 20', { stroke: '#c0392b', sw: 5, name: 'squiggle' });
  ellipse(f, 1000, 520, 150, 150, { stroke: '#8c5a2b', sw: 9, op: 0.45, name: 'coffee ring' });
  text(f, 940, 640, '☕ ☠', { font: 'bold', size: 40, fill: '#1b3a8a', op: 0.7, name: 'doodle' });
  closeBtn(f, 1230, 96, 'BACK');
}

function buildDiary() {
  const f = mk('diary', '16 / Crew log (close-up)', 4, 1);
  zoomBg(f, 'quarters_closed', REGIONS.quarters_closed.bunk, 2.4, 14);
  dim(f, 0.55);
  paperShadow(f, 330, 70, 780, 760, 18);
  rect(f, 330, 70, 780, 760, { fill: '#f1e6cc', r: 18, name: 'notebook' });
  for (let y = 150; y < 800; y += 44) rect(f, 400, y, 680, 1.5, { fill: '#c9b88f', name: 'ruled line' });
  rect(f, 396, 70, 2, 760, { fill: '#d98a8a', op: 0.7, name: 'margin' });
  for (let y = 110; y < 800; y += 62) ellipse(f, 346, y, 20, 20, { fill: '#2a1f14', op: 0.85, name: 'binding hole' });
  text(f, 420, 96, 'LOG  ·  M. OKAFOR', { font: 'head', size: 24, fill: '#2a1f14', ls: 3, name: 'title' });
  const ink = '#1b2a6e';
  text(f, 420, 160, 'DAY 41\nCoolant leak on deck 7 again.\nCommand calls it "nominal".', { font: 'mono', size: 22, lh: 44, fill: ink, name: 'entry' });
  text(f, 420, 340, 'DAY 42\nPin changed overnight. Third time\nthis week. Wrote the trick on the\nwhiteboard in the control room so I\nstop locking myself out.', { font: 'mono', size: 22, lh: 44, fill: ink, name: 'entry' });
  text(f, 420, 600, 'DAY 44\nEveryone took the lifeboats.\nI stayed for the data. Bad call.', { font: 'mono', size: 22, lh: 44, fill: ink, name: 'entry' });
  ellipse(f, 900, 640, 130, 130, { stroke: '#8c5a2b', sw: 8, op: 0.35, name: 'coffee ring' });
  closeBtn(f, 1130, 80, 'BACK');
}

function buildPortholeView() {
  const f = mk('porthole', '17 / Porthole (close-up)', 4, 2);
  zoomBg(f, 'quarters_closed', REGIONS.quarters_closed.porthole, 3.6, 16);
  dim(f, 0.55);
  porthole(f, 410, 110, 620, 5);
  pulse(f, 850, 600, C.red);
  text(f, 0, 790, 'Below: a blue world. Somewhere down there a distress beacon is blinking.\nNobody is answering.', { font: 'mono', size: 18, lh: 30, fill: '#b9cfee', w: W, align: 'CENTER', name: 'caption' });
  closeBtn(f, 1120, 80, 'BACK');
}

function buildManual() {
  const f = mk('manual', '10 / Pod manual (close-up)', 3, 6);
  zoomBg(f, 'pod_dead', REGIONS.pod_dead.manual, 5, 14);
  dim(f, 0.55);
  paperShadow(f, 320, 60, 780, 780, 12);
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
  closeBtn(f, 1060, 76, 'BACK');
}

// ---- hints, about -------------------------------------------------------------------

function hintFrame(key, name, col, row, bg, title, lines) {
  const f = mk(key, name, col, row);
  const b = bgImage(f, bg);
  b.effects = [{ type: 'LAYER_BLUR', radius: 22, visible: true }];
  dim(f, 0.5);
  glass(f, 270, 170, 900, 540, { r: 28, op: 0.7, glow: C.cyan, glowA: 0.16, name: 'card' });
  oxy(f, 670, 92, 104, 'worried');
  text(f, 270, 218, 'NEED A NUDGE?', { font: 'mono', size: 16, fill: C.cyan, ls: 8, w: 900, align: 'CENTER', name: 'eyebrow' });
  text(f, 270, 252, title, { font: 'title', size: 44, fill: C.white, ls: 3, w: 900, align: 'CENTER', name: 'title' });
  lines.forEach((ln, i) => {
    const y = 360 + i * 84;
    ellipse(f, 340, y + 8, 14, 14, { fill: C.cyan, fx: [glow(C.cyan, 10, 0.8)], name: 'bullet' });
    text(f, 376, y, ln, { font: 'body', size: 24, lh: 34, fill: C.white, w: 740, name: 'hint line' });
  });
  text(f, 270, 650, 'Hints are free. Oxygen is not.', { font: 'mono', size: 14, fill: '#a9c3e6', ls: 4, w: 900, align: 'CENTER', name: 'footer' });
  closeBtn(f, 1086, 190, 'BACK');
}

function buildHints() {
  hintFrame('hq', '15 / Hint · quarters', 5, 1, 'quarters_closed', 'SLEEPING QUARTERS', [
    'Not everything you can open is a door.',
    'Look closely at the locker, then at what you are carrying.',
    'Some of the things on the wall are worth remembering.',
  ]);
  hintFrame('hc', '15 / Hint · control room', 5, 4, 'control_sealed', 'CONTROL ROOM', [
    'The terminal wants two digits.',
    'One number is how many crew there were. The other is on a sign.',
    'The whiteboard says what to do with them.',
  ]);
  hintFrame('hp', '15 / Hint · pod bay', 5, 6, 'pod_dead', 'POD BAY', [
    'The panel is dead because three wires are unplugged.',
    'The manual shows which symbol each color belongs to.',
    'Connect them in the order the manual gives: red, blue, yellow.',
  ]);
}

function buildAbout() {
  const f = mk('about', '18 / How this was built', 3, 0);
  const b = bgImage(f, 'space');
  b.effects = [{ type: 'LAYER_BLUR', radius: 10, visible: true }];
  dim(f, 0.4);
  glass(f, 270, 150, 900, 600, { r: 28, op: 0.7, glow: C.cyan, glowA: 0.16, name: 'card' });
  oxy(f, 670, 50, 104, 'happy');
  text(f, 270, 196, 'THE WRONG TOOL', { font: 'mono', size: 16, fill: C.cyan, ls: 8, w: 900, align: 'CENTER', name: 'eyebrow' });
  text(f, 270, 230, 'HOW THIS WAS BUILT', { font: 'title', size: 44, fill: C.white, ls: 3, w: 900, align: 'CENTER', name: 'title' });
  const lines = [
    'No game engine. Every screen is a Figma frame.',
    'The rooms are 3D scenes rendered with three.js, then placed in Figma.',
    'Every click, hint and countdown is a prototype link.',
    'The oxygen timer is an after-delay trigger on each room.',
    'A script generated every frame, hotspot and link.',
  ];
  lines.forEach((ln, i) => {
    const y = 340 + i * 66;
    ellipse(f, 340, y + 8, 14, 14, { fill: C.green, fx: [glow(C.green, 10, 0.8)], name: 'bullet' });
    text(f, 376, y, ln, { font: 'body', size: 24, lh: 34, fill: C.white, w: 740, name: 'line' });
  });
  closeBtn(f, 1086, 170, 'BACK');
}

function buildAllExtra() {
  buildPoster();
  buildWhiteboard();
  buildDiary();
  buildPortholeView();
  buildManual();
  buildHints();
  buildAbout();
}
