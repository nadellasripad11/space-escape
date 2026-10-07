// ---- shared art: backdrop, HUD, toast, inventory ---------------------------

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
    fill: [
      linear(
        [
          [0, '#1b4f9c'],
          [0.55, '#0d2a5c'],
          [1, '#050c1d'],
        ],
        125
      ),
    ],
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

function bgSpace(parent) {
  rect(parent, 0, 0, W, H, {
    fill: linear(
      [
        [0, '#02040a'],
        [1, '#0a1428'],
      ],
      90
    ),
    name: 'space',
  });
  drawStars(parent, 11, 140, 0, 0, W, H);
}

function hud(parent, roomLabel, o2, held, hint) {
  rect(parent, 0, 0, W, 64, {
    fill: linear(
      [
        [0, '#000000', 0.85],
        [1, '#000000', 0],
      ],
      90
    ),
    name: 'hud shade',
  });
  text(parent, 36, 22, 'STATION OMEGA-7', {
    font: 'mono',
    size: 13,
    fill: C.cyan,
    ls: 4,
    name: 'hud / station',
  });
  text(parent, 36 + 220, 22, '//  ' + roomLabel, {
    font: 'mono',
    size: 13,
    fill: C.dim,
    ls: 3,
    name: 'hud / room',
  });
  // oxygen gauge
  const low = o2 <= 10;
  const col = low ? C.red : o2 <= 30 ? C.amber : C.cyan;
  text(parent, W - 36 - 360, 22, 'O2', {
    font: 'head',
    size: 13,
    fill: col,
    ls: 3,
    name: 'hud / o2 label',
  });
  rect(parent, W - 36 - 320, 25, 260, 10, {
    fill: '#ffffff',
    op: 0.08,
    r: 5,
    name: 'o2 track',
  });
  rect(parent, W - 36 - 320, 25, Math.max(8, 260 * (o2 / 100)), 10, {
    fill: col,
    r: 5,
    fx: [glow(col, 10, 0.8)],
    name: 'o2 fill',
  });
  text(parent, W - 36 - 50, 22, o2 + '%', {
    font: 'head',
    size: 13,
    fill: col,
    w: 50,
    align: 'RIGHT',
    name: 'hud / o2 pct',
  });

  // inventory
  const iy = H - 92;
  text(parent, 36, iy - 22, 'INVENTORY', {
    font: 'mono',
    size: 11,
    fill: C.dim,
    ls: 3,
    name: 'inv label',
  });
  for (let i = 0; i < 3; i++) {
    rect(parent, 36 + i * 72, iy, 64, 64, {
      fill: C.panel,
      stroke: C.line,
      sw: 1.5,
      r: 10,
      op: 0.9,
      name: 'inv slot',
    });
  }
  if (held) drawKeycard(parent, 36 + 8, iy + 18, 48, 'inv / keycard');
  if (hint) {
    rect(parent, 640, 15, 130, 34, { fill: '#07101c', stroke: C.cyanDim, sw: 1.5, r: 17, op: 0.92, name: 'hint button' });
    text(parent, 640, 15, '?  HINT', { font: 'mono', size: 13, fill: C.cyan, ls: 3, w: 130, align: 'CENTER', lh: 34, name: 'hint label' });
    go(hotspot(parent, 636, 11, 138, 42, 'hint'), hint, { d: 0.2 });
  }
}

function toast(parent, msg, tone) {
  const col = tone === 'bad' ? C.red : tone === 'good' ? C.green : C.cyan;
  const w = 760;
  const g = frame(parent, (W - w) / 2, H - 150, w, 76, {
    noclip: true,
    fill: '#050a14',
    stroke: col,
    sw: 1.5,
    r: 14,
    op: 0.96,
    fx: [glow(col, 22, 0.35), shadow(8, 24, 0.5)],
    name: 'toast',
  });
  rect(g, 0, 0, 6, 76, { fill: col, name: 'toast bar' });
  text(g, 32, 0, msg, {
    font: 'mono',
    size: 19,
    fill: C.white,
    w: w - 64,
    lh: 76,
    name: 'toast / text',
  });
  return g;
}

function drawKeycard(parent, x, y, w, name) {
  const h = w * 0.64;
  const g = frame(parent, x, y, w, h, {
    noclip: true,
    fill: linear(
      [
        [0, '#1b6dff'],
        [1, '#0b2d7a'],
      ],
      45
    ),
    stroke: '#9fd0ff',
    sw: 1.5,
    r: w * 0.09,
    fx: [glow('#27d3ff', w * 0.4, 0.7)],
    name: name || 'keycard',
  });
  rect(g, 0, h * 0.2, w, h * 0.18, { fill: '#000000', op: 0.55, name: 'stripe' });
  rect(g, w * 0.1, h * 0.58, w * 0.22, h * 0.26, { fill: '#ffd23b', r: 3, name: 'chip' });
  text(g, w * 0.4, h * 0.6, 'LVL 2', {
    font: 'head',
    size: Math.max(7, w * 0.11),
    fill: C.white,
    name: 'level',
  });
  return g;
}

// ---- reusable props ------------------------------------------------------

function pulse(parent, x, y, col) {
  ellipse(parent, x - 22, y - 22, 44, 44, {
    fill: radial([
      [0, col, 0.55],
      [1, col, 0],
    ]),
    name: 'glint',
  });
  ellipse(parent, x - 4, y - 4, 8, 8, { fill: col, fx: [glow(col, 12, 0.9)], name: 'glint core' });
}

function porthole(parent, x, y, d, seed) {
  const g = frame(parent, x, y, d, d, { noclip: true, name: 'porthole' });
  ellipse(g, -10, -10, d + 20, d + 20, {
    fill: linear(
      [
        [0, '#2b3d5e'],
        [1, '#0d1626'],
      ],
      45
    ),
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
  ellipse(g, 0, 0, d, d, {
    fill: linear(
      [
        [0, '#ffffff', 0.18],
        [0.4, '#ffffff', 0],
      ],
      45
    ),
    name: 'glass',
  });
  return g;
}

function hazardStripe(parent, x, y, w, h) {
  const g = frame(parent, x, y, w, h, { fill: '#171a22', name: 'hazard' });
  const step = h * 1.6;
  for (let i = -2; i < w / step + 2; i++) {
    path(
      g,
      i * step * 1.0,
      0,
      'M ' + step * 0.5 + ' 0 L ' + step + ' 0 L ' + (step * 0.5 + h) + ' ' + h + ' L ' + h * 0 + ' ' + h + ' Z',
      { fill: C.amber, op: 0.92, name: 'stripe' }
    );
  }
  return g;
}

function floorTiles(parent, y) {
  rect(parent, 0, y, W, H - y, {
    fill: linear(
      [
        [0, '#1e2f50'],
        [1, '#070c16'],
      ],
      90
    ),
    name: 'floor',
  });
  rect(parent, 0, y, W, 3, { fill: C.cyan, op: 0.35, fx: [glow(C.cyan, 8, 0.5)], name: 'floor edge' });
  for (let i = -6; i <= 14; i++) {
    path(parent, 0, 0, 'M ' + (720 + (i - 4) * 260) + ' ' + H + ' L ' + (720 + (i - 4) * 70) + ' ' + y, {
      stroke: C.line,
      sw: 1,
      op: 0.55,
      name: 'floor line',
    });
  }
  for (let j = 1; j < 5; j++) {
    const yy = y + Math.pow(j / 5, 1.7) * (H - y);
    rect(parent, 0, yy, W, 1, { fill: C.line, op: 0.55, name: 'floor row' });
  }
}

function wallPanels(parent, y0, y1, seed) {
  rect(parent, 0, 0, W, y1, {
    fill: linear(
      [
        [0, '#111c33'],
        [1, '#233452'],
      ],
      90
    ),
    name: 'wall',
  });
  for (let x = 0; x < W; x += 180) {
    rect(parent, x, 0, 3, y1, { fill: '#000000', op: 0.35, name: 'seam' });
    rect(parent, x + 3, 0, 1, y1, { fill: '#ffffff', op: 0.05, name: 'seam hi' });
  }
  rect(parent, 0, y1 - 14, W, 14, { fill: '#0a111f', name: 'baseboard' });
  rect(parent, 0, y1 - 14, W, 2, { fill: C.cyan, op: 0.35, fx: [glow(C.cyan, 6, 0.4)], name: 'baseboard light' });
  rect(parent, 0, 0, W, 40, { fill: '#070d18', name: 'ceiling' });
}

function ceilingLight(parent, x, w, col, op) {
  rect(parent, x, 40, w, 6, { fill: col, op: 0.9, fx: [glow(col, 20, 0.8)], name: 'ceiling light' });
  path(parent, x - 60, 46, 'M 60 0 L ' + (w + 60) + ' 0 L ' + (w + 160) + ' 520 L -40 520 Z', {
    fill: linear(
      [
        [0, col, op],
        [1, col, 0],
      ],
      90
    ),
    name: 'light cone',
  });
}
