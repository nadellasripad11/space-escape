// ---- helpers.js
// ---- drawing helpers ------------------------------------------------------
const W = 1440;
const H = 900;

const C = {
  bg0: '#04070d',
  bg1: '#0a1220',
  hull: '#111b2e',
  hull2: '#18253d',
  panel: '#0d1626',
  line: '#233656',
  cyan: '#27d3ff',
  cyanDim: '#12647a',
  green: '#3dff9a',
  amber: '#ffb020',
  red: '#ff3b4e',
  white: '#e8f4ff',
  dim: '#6f8fb0',
  wireR: '#ff3b4e',
  wireB: '#3b9bff',
  wireY: '#ffd23b',
};

function rgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function solid(hex, a) {
  return { type: 'SOLID', color: rgb(hex), opacity: a === undefined ? 1 : a };
}

// stops: [[offset, hex, alpha], ...]; angle in degrees (0 = left->right, 90 = top->bottom)
function linear(stops, angle) {
  const a = ((angle === undefined ? 90 : angle) * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [c, s, 0.5 - c / 2 - s / 2],
      [-s, c, 0.5 + s / 2 - c / 2],
    ],
    gradientStops: stops.map(([position, hex, alpha]) => ({
      position,
      color: Object.assign(rgb(hex), { a: alpha === undefined ? 1 : alpha }),
    })),
  };
}

function radial(stops) {
  return {
    type: 'GRADIENT_RADIAL',
    gradientTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    gradientStops: stops.map(([position, hex, alpha]) => ({
      position,
      color: Object.assign(rgb(hex), { a: alpha === undefined ? 1 : alpha }),
    })),
  };
}

function toPaint(fill) {
  if (!fill) return [];
  if (typeof fill === 'string') return [solid(fill)];
  if (Array.isArray(fill)) return fill.map((f) => (typeof f === 'string' ? solid(f) : f));
  return [fill];
}

function glow(hex, radius, alpha) {
  return {
    type: 'DROP_SHADOW',
    color: Object.assign(rgb(hex), { a: alpha === undefined ? 0.7 : alpha }),
    offset: { x: 0, y: 0 },
    radius,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  };
}

function shadow(y, radius, alpha) {
  return {
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: alpha === undefined ? 0.5 : alpha },
    offset: { x: 0, y },
    radius,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  };
}

// shared opts: { fill, stroke, sw, r, op, fx, name }
function style(node, o) {
  node.fills = toPaint(o.fill);
  if (o.stroke) {
    node.strokes = toPaint(o.stroke);
    node.strokeWeight = o.sw || 1;
    if (node.type !== 'VECTOR') node.strokeAlign = 'INSIDE';
    if (o.cap) node.strokeCap = o.cap;
  }
  if (o.r !== undefined && 'cornerRadius' in node) node.cornerRadius = o.r;
  if (o.op !== undefined) node.opacity = o.op;
  if (o.fx) node.effects = o.fx;
  if (o.name) node.name = o.name;
  return node;
}

function rect(parent, x, y, w, h, o) {
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.x = x;
  n.y = y;
  n.resize(w, h);
  return style(n, o || {});
}

function ellipse(parent, x, y, w, h, o) {
  const n = figma.createEllipse();
  parent.appendChild(n);
  n.x = x;
  n.y = y;
  n.resize(w, h);
  return style(n, o || {});
}

// polygon / arbitrary path (SVG path data, coordinates relative to x,y)
function path(parent, x, y, d, o) {
  const n = figma.createVector();
  parent.appendChild(n);
  n.vectorPaths = [{ windingRule: 'NONZERO', data: d }];
  n.x = x;
  n.y = y;
  return style(n, o || {});
}

function line(parent, x1, y1, x2, y2, o) {
  const mx = Math.min(x1, x2);
  const my = Math.min(y1, y2);
  return path(parent, mx, my, 'M ' + (x1 - mx) + ' ' + (y1 - my) + ' L ' + (x2 - mx) + ' ' + (y2 - my), o);
}

function curve(parent, x1, y1, x2, y2, o) {
  const mx = Math.min(x1, x2);
  const my = Math.min(y1, y2);
  const ax = x1 - mx, ay = y1 - my, bx = x2 - mx, by = y2 - my;
  const mid = (ax + bx) / 2;
  return path(parent, mx, my, 'M ' + ax + ' ' + ay + ' C ' + mid + ' ' + ay + ' ' + mid + ' ' + by + ' ' + bx + ' ' + by, o);
}

function frame(parent, x, y, w, h, o) {
  const n = figma.createFrame();
  if (parent) parent.appendChild(n);
  n.x = x;
  n.y = y;
  n.resize(w, h);
  n.clipsContent = !(o && o.noclip);
  style(n, o || {});
  if (!(o && o.fill)) n.fills = [];
  return n;
}

// fonts ---------------------------------------------------------------------
const FONT = {
  title: { family: 'Orbitron', style: 'Black' },
  head: { family: 'Orbitron', style: 'Bold' },
  mono: { family: 'Share Tech Mono', style: 'Regular' },
  body: { family: 'Inter', style: 'Medium' },
  bold: { family: 'Inter', style: 'Bold' },
};
const FALLBACK = {
  title: { family: 'Inter', style: 'Black' },
  head: { family: 'Inter', style: 'Bold' },
  mono: { family: 'Roboto Mono', style: 'Regular' },
  body: { family: 'Inter', style: 'Medium' },
  bold: { family: 'Inter', style: 'Bold' },
};

async function loadFonts() {
  for (const k of Object.keys(FONT)) {
    try {
      await figma.loadFontAsync(FONT[k]);
    } catch (e) {
      FONT[k] = FALLBACK[k];
      await figma.loadFontAsync(FONT[k]);
    }
  }
}

// opts: { size, font, fill, align, w, ls (letter spacing px), lh (line height px), op, fx, name }
function text(parent, x, y, str, o) {
  o = o || {};
  const t = figma.createText();
  parent.appendChild(t);
  t.fontName = FONT[o.font || 'mono'];
  t.fontSize = o.size || 16;
  t.characters = str;
  t.fills = toPaint(o.fill || C.white);
  if (o.ls !== undefined) t.letterSpacing = { value: o.ls, unit: 'PIXELS' };
  if (o.lh !== undefined) t.lineHeight = { value: o.lh, unit: 'PIXELS' };
  if (o.w) {
    t.resize(o.w, t.height);
    t.textAutoResize = 'HEIGHT';
  }
  t.textAlignHorizontal = o.align || 'LEFT';
  t.x = x;
  t.y = y;
  if (o.op !== undefined) t.opacity = o.op;
  if (o.fx) t.effects = o.fx;
  if (o.name) t.name = o.name;
  return t;
}

// a transparent, clickable hotspot
function hotspot(parent, x, y, w, h, name) {
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.x = x;
  n.y = y;
  n.resize(w, h);
  n.fills = [solid('#ffffff', 0.01)];
  n.name = 'hotspot / ' + name;
  return n;
}

// seeded RNG so every generation is identical
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- art.js
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

// ---- flow.js
// ---- frame registry + prototype wiring -------------------------------------
// Links are encoded into layer names ("hotspot / vent → {json}") so that every
// build step can run as its own script; wire() resolves them in a final pass.
const GRID_X = W + 160;
const GRID_Y = H + 200;
const OXYGEN_SECONDS = 150; // idle time before the lungs give out

function mk(key, name, col, row) {
  const f = figma.createFrame();
  f.name = key + ' · ' + name;
  f.resize(W, H);
  f.clipsContent = true;
  f.fills = [solid(C.bg0)];
  f.x = col * GRID_X;
  f.y = row * GRID_Y;
  figma.currentPage.appendChild(f);
  return f;
}

function tag(node, kind, to, o, secs) {
  const spec = Object.assign({ k: kind, to }, secs === undefined ? {} : { s: secs }, o || {});
  node.name = node.name + ' → ' + JSON.stringify(spec);
}

// click -> navigate. `to` is a frame key or 'BACK'
function go(node, to, o) {
  tag(node, 'click', to, o);
}

// timed -> navigate; the reaction lives on the frame, a 1px marker carries the spec
function after(frameNode, secs, to, o) {
  const m = rect(frameNode, 0, 0, 1, 1, { fill: '#000000', op: 0 });
  m.name = 'timer';
  tag(m, 'timer', to, o, secs);
}

function lungs(f) {
  after(f, OXYGEN_SECONDS, 'lose', { d: 1.4 });
}

// ---- screen fx as shared components ---------------------------------------
function fx(parent, alert) {
  const name = 'FX / scanlines + vignette' + (alert ? ' / alert' : '');
  let c = figma.currentPage.findChild((n) => n.type === 'COMPONENT' && n.name === name);
  if (!c) {
    c = figma.createComponent();
    c.name = name;
    c.resize(W, H);
    c.fills = [];
    c.clipsContent = true;
    for (let y = 0; y < H; y += 4) rect(c, 0, y, W, 1, { fill: '#000000', op: 0.1, name: 'scan' });
    rect(c, 0, 0, W, H, {
      fill: radial([
        [0.55, '#000000', 0],
        [1, '#000000', 0.55],
      ]),
      name: 'vignette',
    });
    if (alert) {
      rect(c, 0, 0, W, H, {
        fill: radial([
          [0.45, C.red, 0],
          [1, C.red, 0.2],
        ]),
        name: 'alert glow',
      });
    }
    c.x = -(W + 300);
    c.y = alert ? GRID_Y : 0;
    figma.currentPage.appendChild(c);
  }
  const inst = c.createInstance();
  parent.appendChild(inst);
  inst.x = 0;
  inst.y = 0;
  inst.name = 'screen fx';
  return inst;
}

// ---- ui.js
// ---- title, quarters, control room ------------------------------------------

function closeBtn(f, x, y, to) {
  rect(f, x, y, 44, 44, { fill: '#0b1424', stroke: C.line, sw: 1.5, r: 22, name: 'close' });
  text(f, x, y, '✕', { font: 'bold', size: 18, fill: C.white, w: 44, align: 'CENTER', lh: 44, name: 'close x' });
  go(hotspot(f, x - 6, y - 6, 56, 56, 'close'), to, { d: 0.18 });
}

function pill(f, x, y, w, h, label, col, filled) {
  rect(f, x, y, w, h, {
    fill: filled ? col : '#050a14',
    stroke: col,
    sw: 2,
    r: h / 2,
    fx: [glow(col, 24, filled ? 0.55 : 0.3)],
    name: 'button',
  });
  text(f, x, y, label, {
    font: 'head',
    size: Math.round(h * 0.3),
    fill: filled ? '#02121a' : col,
    ls: 4,
    w,
    align: 'CENTER',
    lh: h,
    name: 'button label',
  });
}


// ---- rooms1a.js
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


// ---- rooms1b.js
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
  hud(f, 'CONTROL ROOM', 11, true, 'hc');
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

// ---- rooms2.js
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
  const slots = !good && !bad;
  if (slots) {
    for (let i = 0; i < 2; i++) {
      const filled = i === 0 && st !== 'k0';
      ellipse(f, 720 + (i ? 52 : -52) - 18, 225 - 18, 36, 36, filled ? { fill: tone, fx: [glow(tone, 16, 0.8)], name: 'digit slot' } : { stroke: tone, sw: 3, op: 0.7, name: 'digit slot' });
    }
  }
  const shown = good ? 'ACCESS GRANTED' : bad ? 'ACCESS DENIED' : '';
  if (shown) text(f, 480, 170, shown, {
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
  hud(f, 'ESCAPE POD BAY', 5, true, 'hp');
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
  drawPodShip(f, 120, 440, true, false);
  rect(f, 0, 0, W, H, { fill: '#000000', op: 0.35, name: 'dim' });
  text(f, 0, 70, 'LAUNCH IN', { font: 'mono', size: 20, fill: C.dim, ls: 12, w: W, align: 'CENTER', name: 'label' });
  text(f, 0, 110, String(n), { font: 'title', size: 260, fill: n === 1 ? C.red : C.cyan, w: W, align: 'CENTER', fx: [glow(n === 1 ? C.red : C.cyan, 60, 0.5)], name: 'count' });
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
  drawPodShip(f, gone ? 1500 : 120, 440, true, true);
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
  text(f, 0, 740, 'how this was built  →', { font: 'mono', size: 15, fill: C.cyan, ls: 4, w: W, align: 'CENTER', name: 'about link' });
  go(hotspot(f, 520, 728, 400, 44, 'about'), 'about', { d: 0.3 });
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

// ---- rooms3.js
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

// ---- wire.js
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

// ---- plugin-main.js
// ---- plugin entry --------------------------------------------------------------
function rowLabels() {
  const rows = [
    [0, 'TITLE  ·  ENDINGS  ·  ABOUT'],
    [1, 'ACT I  ·  SLEEPING QUARTERS'],
    [2, 'ACT I  ·  LOCKER OPEN'],
    [3, 'ACT I  ·  KEYCARD IN HAND'],
    [4, 'ACT II  ·  CONTROL ROOM'],
    [5, 'ACT II  ·  AIRLOCK KEYPAD'],
    [6, 'ACT III  ·  POD BAY'],
    [7, 'ACT III  ·  WIRING'],
    [8, 'LAUNCH'],
  ];
  for (const [row, label] of rows) {
    text(figma.currentPage, 0, row * GRID_Y - 64, label, { font: 'mono', size: 20, fill: C.dim, ls: 8, name: 'row label' });
  }
}

(async () => {
  const page = figma.createPage();
  page.name = 'OMEGA-7 (generated)';
  await figma.setCurrentPageAsync(page);
  await loadFonts();
  buildTitle();
  buildAllQuarters();
  buildPoster();
  buildAllControl();
  buildWhiteboard();
  buildAllKeypad();
  buildAllPod();
  buildAllWires();
  buildAllEnd();
  buildAllExtra();
  rowLabels();
  const r = await wire();
  if (!r.winReachable || r.unreachable.length) {
    figma.closePlugin('OMEGA-7 built, but the flow check failed: ' + JSON.stringify(r));
    return;
  }
  const title = figma.currentPage.findChild((n) => n.name.startsWith('title · '));
  figma.viewport.scrollAndZoomIntoView([title]);
  figma.closePlugin('OMEGA-7 built: ' + r.frames + ' frames, ' + r.links + ' linked layers. Select the title frame and press Present.');
})();
