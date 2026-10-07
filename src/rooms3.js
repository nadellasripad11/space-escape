// ---- hints, story close-ups, about page -------------------------------------

function hintFrame(key, name, col, row, title, lines) {
  const f = mk(key, name, col, row);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#12203a'], [1, '#03060b']]), name: 'backdrop' });
  rect(f, 270, 170, 900, 540, {
    fill: linear([[0, '#1d2d4b'], [1, '#0b1322']], 90),
    stroke: '#4a628c',
    sw: 2,
    r: 28,
    fx: [shadow(24, 60, 0.8), glow(C.cyan, 40, 0.14)],
    name: 'card',
  });
  text(f, 270, 218, 'NEED A NUDGE?', { font: 'mono', size: 16, fill: C.cyan, ls: 8, w: 900, align: 'CENTER', name: 'eyebrow' });
  text(f, 270, 252, title, { font: 'title', size: 44, fill: C.white, ls: 3, w: 900, align: 'CENTER', name: 'title' });
  lines.forEach((ln, i) => {
    const y = 360 + i * 84;
    ellipse(f, 340, y + 8, 14, 14, { fill: C.cyan, fx: [glow(C.cyan, 10, 0.8)], name: 'bullet' });
    text(f, 376, y, ln, { font: 'body', size: 24, lh: 34, fill: C.white, w: 740, name: 'hint line' });
  });
  text(f, 270, 650, 'Hints are free. Oxygen is not.', { font: 'mono', size: 14, fill: C.dim, ls: 4, w: 900, align: 'CENTER', name: 'footer' });
  fx(f);
  closeBtn(f, 1086, 190, 'BACK');
}

function buildHints() {
  hintFrame('hq', '15 / Hint · quarters', 5, 1, 'SLEEPING QUARTERS', [
    'Not everything you can open is a door.',
    'Look closely at the locker, then at what you are carrying.',
    'Some of the things on the wall are worth remembering.',
  ]);
  hintFrame('hc', '15 / Hint · control room', 5, 4, 'CONTROL ROOM', [
    'The terminal wants two digits.',
    'One number is how many crew there were. The other is on a sign.',
    'The whiteboard says what to do with them.',
  ]);
  hintFrame('hp', '15 / Hint · pod bay', 5, 6, 'POD BAY', [
    'The panel is dead because three wires are unplugged.',
    'The manual shows which symbol each color belongs to.',
    'Connect them in the order the manual gives: red, blue, yellow.',
  ]);
}

function buildDiary() {
  const f = mk('diary', '16 / Crew log (close-up)', 4, 1);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#1a2a47'], [1, '#04070d']]), name: 'backdrop' });
  rect(f, 340, 80, 780, 760, { fill: '#000000', op: 0.5, r: 18, fx: [shadow(24, 60, 0.8)], name: 'shadow' });
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
  fx(f);
  closeBtn(f, 1130, 80, 'BACK');
}

function buildPortholeView() {
  const f = mk('porthole', '17 / Porthole (close-up)', 4, 2);
  rect(f, 0, 0, W, H, { fill: radial([[0, '#0d1a30'], [1, '#02040a']]), name: 'backdrop' });
  porthole(f, 410, 110, 620, 5);
  pulse(f, 850, 600, C.red);
  text(f, 0, 790, 'Below: a blue world. Somewhere down there a distress beacon is blinking.\nNobody is answering.', { font: 'mono', size: 18, lh: 30, fill: C.dim, w: W, align: 'CENTER', name: 'caption' });
  fx(f);
  closeBtn(f, 1120, 80, 'BACK');
}

function buildAbout() {
  const f = mk('about', '18 / How this was built', 3, 0);
  bgSpace(f);
  rect(f, 270, 150, 900, 600, {
    fill: linear([[0, '#1d2d4b'], [1, '#0b1322']], 90),
    stroke: '#4a628c',
    sw: 2,
    r: 28,
    fx: [shadow(24, 60, 0.8), glow(C.cyan, 40, 0.14)],
    name: 'card',
  });
  text(f, 270, 196, 'THE WRONG TOOL', { font: 'mono', size: 16, fill: C.cyan, ls: 8, w: 900, align: 'CENTER', name: 'eyebrow' });
  text(f, 270, 230, 'HOW THIS WAS BUILT', { font: 'title', size: 44, fill: C.white, ls: 3, w: 900, align: 'CENTER', name: 'title' });
  const lines = [
    'No game engine. Every screen is a Figma frame.',
    'Every click, hint and countdown is a prototype link.',
    'The oxygen timer is an after-delay trigger on each room.',
    'The PIN keypad is a five-frame state machine.',
    'A script generated every room, prop, wire and link.',
  ];
  lines.forEach((ln, i) => {
    const y = 340 + i * 66;
    ellipse(f, 340, y + 8, 14, 14, { fill: C.green, fx: [glow(C.green, 10, 0.8)], name: 'bullet' });
    text(f, 376, y, ln, { font: 'body', size: 24, lh: 34, fill: C.white, w: 740, name: 'line' });
  });
  fx(f);
  closeBtn(f, 1086, 170, 'BACK');
}

function buildAllExtra() {
  buildHints();
  buildDiary();
  buildPortholeView();
  buildAbout();
}
