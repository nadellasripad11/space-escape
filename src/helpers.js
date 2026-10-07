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
