// ---- TITLE -----------------------------------------------------------------
function buildTitle() {
  const f = mk('title', '00 / Title', 0, 0);
  bgSpace(f);
  drawPlanet(f, 880, 420, 900);
  // spinning habitat ring
  const cx = 1150;
  const cy = 170;
  ellipse(f, cx - 210, cy - 70, 420, 140, { stroke: '#4d6a95', sw: 14, name: 'ring outer' });
  ellipse(f, cx - 210, cy - 70, 420, 140, { stroke: C.cyan, sw: 2, op: 0.7, fx: [glow(C.cyan, 14, 0.6)], name: 'ring lights' });
  rect(f, cx - 26, cy - 90, 52, 180, { fill: linear([[0, '#3a5282'], [1, '#17243d']], 0), r: 10, name: 'hub' });
  rect(f, cx - 6, cy - 150, 12, 300, { fill: '#2b3d5e', r: 6, name: 'mast' });
  ellipse(f, cx - 7, cy - 7, 14, 14, { fill: C.red, fx: [glow(C.red, 16, 0.9)], name: 'beacon' });

  text(f, 120, 250, 'A FIGMA ESCAPE ROOM', { font: 'mono', size: 16, fill: C.cyan, ls: 8, name: 'eyebrow' });
  text(f, 112, 290, 'OMEGA-7', {
    font: 'title',
    size: 188,
    fill: C.white,
    ls: 6,
    fx: [glow(C.cyan, 40, 0.35)],
    name: 'title',
  });
  text(f, 120, 520, 'You wake up alone.\nOxygen is falling. Find the escape pod.', {
    font: 'body',
    size: 26,
    lh: 40,
    fill: C.dim,
    name: 'tagline',
  });
  pill(f, 120, 650, 320, 76, 'WAKE UP  →', C.cyan, true);
  text(f, 120, 780, 'Present mode.  Click everything.  Trust nothing.', {
    font: 'mono',
    size: 14,
    fill: C.dim,
    ls: 2,
    name: 'hint',
  });
  fx(f);
  go(hotspot(f, 120, 650, 320, 76, 'wake up'), 'q1', { d: 0.9 });
}

// ---- QUARTERS --------------------------------------------------------------
function drawLocker(f, state) {
  const x = 1020;
  const y = 240;
  rect(f, x - 10, y - 10, 190, 420, { fill: '#0a111f', r: 8, fx: [shadow(10, 24, 0.6)], name: 'locker frame' });
  if (state === 'closed') {
    rect(f, x, y, 170, 400, {
      fill: linear([[0, '#43587d'], [0.5, '#2f4263'], [1, '#243350']], 0),
      stroke: '#5b7299',
      sw: 1.5,
      r: 6,
      name: 'locker door',
    });
    for (let i = 0; i < 4; i++) rect(f, x + 30, y + 26 + i * 12, 110, 5, { fill: '#0a111f', r: 2, name: 'slit' });
    rect(f, x + 130, y + 190, 14, 70, { fill: '#9fb4d2', r: 5, name: 'handle' });
    ellipse(f, x + 18, y + 330, 14, 14, { fill: C.red, fx: [glow(C.red, 12, 0.9)], name: 'lock led' });
    text(f, x, y + 350, 'C-3', { font: 'mono', size: 14, fill: C.dim, ls: 3, w: 170, align: 'CENTER', name: 'plate' });
  } else {
    rect(f, x, y, 170, 400, { fill: '#04070d', stroke: '#2b3d5e', sw: 2, r: 6, name: 'locker inside' });
    rect(f, x + 8, y + 150, 154, 6, { fill: '#2b3d5e', name: 'shelf' });
    rect(f, x + 8, y + 290, 154, 6, { fill: '#2b3d5e', name: 'shelf' });
    rect(f, x + 30, y + 40, 40, 110, { fill: '#142036', r: 4, name: 'jacket' });
    rect(f, x + 100, y + 300, 50, 80, { fill: '#142036', r: 4, name: 'boots' });
    path(f, x - 66, y, 'M 66 0 L 0 28 L 0 372 L 66 400 Z', {
      fill: linear([[0, '#2a3b5a'], [1, '#43587d']], 0),
      stroke: '#5b7299',
      sw: 1.5,
      name: 'locker door open',
    });
    if (state === 'open') {
      ellipse(f, x - 20, y + 60, 210, 90, {
        fill: radial([[0, C.cyan, 0.4], [1, C.cyan, 0]]),
        name: 'card glow',
      });
      const k = drawKeycard(f, x + 52, y + 98, 76, 'keycard (on shelf)');
      k.rotation = 8;
      pulse(f, x + 128, y + 108, C.white);
    }
  }
}

function drawBunk(f) {
  ellipse(f, 270, 610, 460, 50, { fill: '#000000', op: 0.55, name: 'bunk shadow' });
  rect(f, 300, 300, 16, 340, { fill: linear([[0, '#52678b'], [1, '#2b3d5e']], 0), r: 4, name: 'post' });
  rect(f, 684, 300, 16, 340, { fill: linear([[0, '#52678b'], [1, '#2b3d5e']], 0), r: 4, name: 'post' });
  // upper
  rect(f, 316, 424, 368, 14, { fill: '#2b3d5e', name: 'plate' });
  rect(f, 316, 386, 368, 40, { fill: linear([[0, '#3d5578'], [1, '#2a3b5a']], 90), r: 10, name: 'mattress' });
  rect(f, 330, 370, 74, 28, { fill: '#8aa2c4', r: 12, name: 'pillow' });
  rect(f, 410, 380, 266, 48, { fill: '#1f3b6e', r: 10, name: 'blanket' });
  // lower
  rect(f, 316, 584, 368, 14, { fill: '#2b3d5e', name: 'plate' });
  rect(f, 316, 540, 368, 46, { fill: linear([[0, '#3d5578'], [1, '#2a3b5a']], 90), r: 10, name: 'mattress' });
  rect(f, 330, 522, 74, 30, { fill: '#8aa2c4', r: 12, name: 'pillow' });
  rect(f, 400, 536, 280, 54, { fill: '#6b2a3a', r: 10, name: 'blanket (rumpled)' });
  path(f, 400, 536, 'M 20 18 Q 60 4 110 20 Q 160 36 220 16', { stroke: '#8d4153', sw: 3, name: 'fold' });
  // ladder
  rect(f, 640, 330, 6, 310, { fill: '#7d93b8', r: 3, name: 'rail' });
  rect(f, 668, 330, 6, 310, { fill: '#7d93b8', r: 3, name: 'rail' });
  for (let i = 0; i < 7; i++) rect(f, 640, 354 + i * 40, 34, 5, { fill: '#9fb4d2', r: 2, name: 'rung' });
}

function drawVent(f) {
  rect(f, 440, 96, 300, 110, { fill: '#0a111f', stroke: '#3a5282', sw: 3, r: 8, fx: [shadow(6, 14, 0.5)], name: 'vent plate' });
  rect(f, 452, 108, 276, 86, { fill: '#02040a', r: 4, name: 'vent hole' });
  for (let i = 0; i < 6; i++) {
    path(f, 452, 112 + i * 14, 'M 0 0 L 276 0 L 276 8 L 0 12 Z', { fill: '#3a5282', name: 'slat' });
  }
  ellipse(f, 452, 100, 276, 100, { fill: radial([[0, C.green, 0.1], [1, C.green, 0]]), name: 'vent glow' });
  [452, 716].forEach((sx) => ellipse(f, sx - 2, 100, 10, 10, { fill: '#7d93b8', name: 'screw' }));
}

function drawPoster(f) {
  rect(f, 780, 172, 200, 270, { fill: '#000000', op: 0.4, r: 4, name: 'poster shadow' });
  rect(f, 774, 166, 200, 270, { fill: '#dfe9f3', r: 4, name: 'poster' });
  rect(f, 774, 166, 200, 46, { fill: '#1b6dff', r: 4, name: 'poster head' });
  text(f, 774, 166, 'CREW ROSTER', { font: 'head', size: 17, fill: C.white, ls: 2, w: 200, align: 'CENTER', lh: 46, name: 'poster title' });
  for (let i = 0; i < 8; i++) {
    rect(f, 792, 232 + i * 24, 20, 12, { fill: '#9fb4d2', r: 2, name: 'bullet' });
    rect(f, 822, 234 + i * 24, 110 - (i % 3) * 14, 8, { fill: '#6f8fb0', r: 4, name: 'name line' });
  }
  rect(f, 810, 412, 130, 14, { fill: '#c3d4e6', r: 3, name: 'footer' });
  rect(f, 770, 176, 24, 8, { fill: '#e8d9a8', op: 0.8, name: 'tape' });
  rect(f, 954, 176, 24, 8, { fill: '#e8d9a8', op: 0.8, name: 'tape' });
}

function drawQDoor(f, held) {
  const x = 1252;
  const y = 250;
  rect(f, x - 14, y - 14, 202, 418, { fill: '#0a111f', r: 10, fx: [shadow(8, 24, 0.6)], name: 'door frame' });
  rect(f, x, y, 174, 390, { fill: linear([[0, '#2f4263'], [1, '#1c2a44']], 0), stroke: '#4a628c', sw: 1.5, r: 6, name: 'door' });
  rect(f, x + 84, y, 6, 390, { fill: '#000000', op: 0.55, name: 'door seam' });
  rect(f, x + 14, y + 40, 56, 120, { fill: '#0a111f', r: 6, name: 'door window' });
  rect(f, x + 104, y + 40, 56, 120, { fill: '#0a111f', r: 6, name: 'door window' });
  const col = held ? C.green : C.red;
  rect(f, x + 20, y - 8, 134, 8, { fill: col, r: 4, fx: [glow(col, 20, 0.9)], name: 'door light' });
  text(f, x, y + 330, held ? 'LVL 2 · READY' : 'LOCKED', {
    font: 'mono', size: 14, fill: col, ls: 3, w: 174, align: 'CENTER', name: 'door status',
  });
  // card reader
  rect(f, x - 52, y + 150, 34, 74, { fill: '#0a111f', stroke: '#4a628c', sw: 1.5, r: 6, name: 'reader' });
  rect(f, x - 44, y + 164, 18, 6, { fill: '#000000', name: 'slot' });
  ellipse(f, x - 42, y + 190, 12, 12, { fill: col, fx: [glow(col, 10, 0.9)], name: 'reader led' });
}

function buildQuarters(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  wallPanels(f, 0, 640);
  floorTiles(f, 640);
  ceilingLight(f, 560, 240, '#ff5a3b', 0.18);
  porthole(f, 130, 190, 200, 3);
  drawVent(f);
  drawBunk(f);
  drawPoster(f);
  drawLocker(f, s.locker);
  drawQDoor(f, s.held);
  fx(f, true);
  hud(f, 'SLEEPING QUARTERS', 18, s.held, 'hq');
  toast(f, s.toast, s.tone);

  // hotspots last so they sit on top
  go(hotspot(f, 440, 96, 300, 110, 'vent'), s.locker === 'open' ? 'q2v' : s.locker === 'empty' ? 'q3v' : 'q1v');
  go(hotspot(f, 770, 160, 210, 285, 'crew poster'), 'poster', { d: 0.3 });
  go(hotspot(f, 320, 300, 380, 340, 'bunk'), 'diary', { d: 0.3 });
  go(hotspot(f, 120, 180, 200, 210, 'porthole'), 'porthole', { d: 0.3 });
  if (s.locker === 'closed') go(hotspot(f, 1010, 230, 190, 420, 'locker'), 'q2');
  if (s.locker === 'open') go(hotspot(f, 1040, 320, 120, 100, 'keycard'), 'q3');
  if (s.locker === 'empty') go(hotspot(f, 1010, 230, 190, 420, 'locker (empty)'), 'q3l');
  if (s.held) go(hotspot(f, 1230, 230, 210, 430, 'door'), 'c1', { t: 'PUSH', dir: 'LEFT', d: 0.7, ease: 'EASE_IN_AND_OUT' });
  else go(hotspot(f, 1230, 230, 210, 430, 'door'), s.locker === 'open' ? 'q2d' : 'q1d');
  lungs(f);
  return f;
}

function buildAllQuarters() {
  const A = { locker: 'closed', held: false };
  const B = { locker: 'open', held: false };
  const Cc = { locker: 'empty', held: true };
  buildQuarters('q1', '01 / Quarters', 0, 1, Object.assign({ toast: 'Alarms. A throbbing head. Look around — something must open.' }, A));
  buildQuarters('q1v', '01 / Quarters · vent', 1, 1, Object.assign({ toast: 'Too small to crawl through. Nothing in there but dust.' }, A));
  buildQuarters('q1d', '01 / Quarters · locked door', 2, 1, Object.assign({ toast: 'Magnetic lock. It wants a keycard.', tone: 'bad' }, A));
  buildQuarters('q2', '02 / Quarters · locker open', 0, 2, Object.assign({ toast: 'The locker pops. Something is glinting on the shelf.', tone: 'good' }, B));
  buildQuarters('q2v', '02 / Quarters · vent', 1, 2, Object.assign({ toast: 'Too small to crawl through. Nothing in there but dust.' }, B));
  buildQuarters('q2d', '02 / Quarters · locked door', 2, 2, Object.assign({ toast: 'Magnetic lock. It wants a keycard.', tone: 'bad' }, B));
  buildQuarters('q3', '03 / Quarters · keycard', 0, 3, Object.assign({ toast: 'KEYCARD ACQUIRED — LEVEL 2 CLEARANCE', tone: 'good' }, Cc));
  buildQuarters('q3v', '03 / Quarters · vent', 1, 3, Object.assign({ toast: 'Too small to crawl through. Nothing in there but dust.' }, Cc));
  buildQuarters('q3l', '03 / Quarters · empty locker', 2, 3, Object.assign({ toast: 'Empty. A dent where the keycard used to be.' }, Cc));
}

