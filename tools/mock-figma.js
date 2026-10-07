// Offline stand-in for the figma plugin api, just big enough to run plugin/code.js
// and render the generated frames to png, so layout can be checked without figma.
// usage: node tools/mock-figma.js <outDir> [frameKey ...]
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Resvg } = require('./node_modules/@resvg/resvg-js');

let nextId = 1;
const fmt = (n) => Math.round(n * 100) / 100;

class MockNode {
  constructor(type) {
    this.type = type;
    this.id = '1:' + nextId++;
    this.name = type.toLowerCase();
    this.x = 0;
    this.y = 0;
    this.width = 100;
    this.height = 100;
    this.rotation = 0;
    this.opacity = 1;
    this.visible = true;
    this.children = [];
    this.parent = null;
    this.fills = [];
    this.strokes = [];
    this.strokeWeight = 1;
    this.effects = [];
    this.cornerRadius = 0;
    this.clipsContent = type === 'FRAME' || type === 'COMPONENT';
    this.reactions = [];
    this.characters = '';
    this.fontSize = 12;
    this.fontName = { family: 'Inter', style: 'Regular' };
    this.letterSpacing = { value: 0, unit: 'PIXELS' };
    this.lineHeight = { unit: 'AUTO' };
    this.textAlignHorizontal = 'LEFT';
    this.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  resize(w, h) { this.width = w; this.height = h; }
  appendChild(c) {
    if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1);
    c.parent = this;
    this.children.push(c);
  }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  findAll(fn) {
    const out = [];
    const walk = (n) => { for (const c of n.children) { if (fn(c)) out.push(c); walk(c); } };
    walk(this);
    return out;
  }
  findChild(fn) { return this.children.find(fn) || null; }
  async setReactionsAsync(r) { this.reactions = r; }
  createInstance() {
    const clone = (n) => {
      const c = new MockNode(n.type === 'COMPONENT' ? 'INSTANCE' : n.type);
      for (const k of Object.keys(n)) if (!['id', 'children', 'parent', 'type'].includes(k)) c[k] = n[k];
      for (const ch of n.children) c.appendChild(clone(ch));
      return c;
    };
    return clone(this);
  }
  set characters(v) { this._chars = v; this._measure(); }
  get characters() { return this._chars || ''; }
  _measure() {
    if (this.type !== 'TEXT') return;
    const lines = this.characters.split('\n');
    const ls = this.letterSpacing && this.letterSpacing.value ? this.letterSpacing.value : 0;
    const w = Math.max(...lines.map((l) => l.length)) * (this.fontSize * 0.6 + ls);
    const lh = this.lineHeight && this.lineHeight.unit === 'PIXELS' ? this.lineHeight.value : this.fontSize * 1.2;
    if (this.textAutoResize === 'WIDTH_AND_HEIGHT') this.width = w;
    this.height = lh * lines.length;
  }
}

function makeFigma() {
  const pages = [];
  const root = { children: pages };
  const mkPage = (name) => {
    const p = new MockNode('PAGE');
    p.name = name;
    p.flowStartingPoints = [];
    p.loadAsync = async () => {};
    pages.push(p);
    return p;
  };
  const first = mkPage('Page 1');
  const f = {
    root,
    currentPage: first,
    closed: null,
    viewport: { scrollAndZoomIntoView() {} },
    createPage: () => mkPage('Page'),
    setCurrentPageAsync: async (p) => { f.currentPage = p; },
    loadFontAsync: async () => {},
    createFrame: () => new MockNode('FRAME'),
    createRectangle: () => new MockNode('RECTANGLE'),
    createEllipse: () => new MockNode('ELLIPSE'),
    createVector: () => {
      const n = new MockNode('VECTOR');
      let paths = [];
      Object.defineProperty(n, 'vectorPaths', { get: () => paths, set: (v) => { paths = v; const b = pathBounds(v[0].data); n.width = b.w; n.height = b.h; n._off = b; } });
      return n;
    },
    createText: () => new MockNode('TEXT'),
    createComponent: () => new MockNode('COMPONENT'),
    closePlugin(msg) { f.closed = msg || ''; if (f._done) f._done(); },
  };
  return f;
}

function pathBounds(d) {
  const nums = d.replace(/[A-Za-z]/g, ' ').trim().split(/\s+/).map(Number);
  const xs = [], ys = [];
  nums.forEach((v, i) => (i % 2 ? ys : xs).push(v));
  const minx = Math.min(...xs), miny = Math.min(...ys);
  return { w: Math.max(...xs) - minx, h: Math.max(...ys) - miny, minx, miny };
}

// ---- svg rendering --------------------------------------------------------------
const FAMILY = {
  Orbitron: "'Arial Black', Arial",
  'Share Tech Mono': 'Consolas',
  'Roboto Mono': 'Consolas',
  Inter: "'Segoe UI', Arial",
};
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

function render(frame, prefix) {
  prefix = prefix || '';
  let defs = '';
  let gid = 0;
  const inv = (m) => {
    const [[a, c, e], [b, d, f]] = m; // [[a c e],[b d f]]
    const det = a * d - b * c;
    return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
  };
  const paint = (p, node) => {
    if (p.type === 'SOLID') return { fill: hex(p.color), op: p.opacity === undefined ? 1 : p.opacity };
    const id = prefix + 'g' + gid++;
    const m = inv(p.gradientTransform);
    const stops = p.gradientStops.map((s) => '<stop offset="' + s.position + '" stop-color="' + hex(s.color) + '" stop-opacity="' + (s.color.a === undefined ? 1 : s.color.a) + '"/>').join('');
    const tf = 'matrix(' + m.map((v) => fmt(v * 1e4) / 1e4).join(' ') + ')';
    if (p.type === 'GRADIENT_LINEAR') defs += '<linearGradient id="' + id + '" gradientUnits="objectBoundingBox" x1="0" y1="0.5" x2="1" y2="0.5" gradientTransform="' + tf + '">' + stops + '</linearGradient>';
    else defs += '<radialGradient id="' + id + '" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5" gradientTransform="' + tf + '">' + stops + '</radialGradient>';
    return { fill: 'url(#' + id + ')', op: p.opacity === undefined ? 1 : p.opacity };
  };
  const fxAttr = (node) => {
    const ds = (node.effects || []).filter((e) => e.type === 'DROP_SHADOW' && e.visible !== false);
    if (!ds.length) return '';
    const id = prefix + 'f' + gid++;
    let prims = '';
    let last = 'SourceGraphic';
    // stack shadows beneath the source
    const merge = [];
    ds.forEach((e, i) => {
      prims += '<feGaussianBlur in="SourceAlpha" stdDeviation="' + e.radius / 2 + '" result="b' + i + '"/><feOffset in="b' + i + '" dx="' + e.offset.x + '" dy="' + e.offset.y + '" result="o' + i + '"/><feFlood flood-color="' + hex(e.color) + '" flood-opacity="' + e.color.a + '"/><feComposite in2="o' + i + '" operator="in" result="s' + i + '"/>';
      merge.push('<feMergeNode in="s' + i + '"/>');
    });
    defs += '<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">' + prims + '<feMerge>' + merge.join('') + '<feMergeNode in="SourceGraphic"/></feMerge></filter>';
    return ' filter="url(#' + id + ')"';
  };
  const fillAttrs = (node) => {
    const fills = (node.fills || []).filter((p) => p.visible !== false);
    if (!fills.length) return { fill: 'none', extra: '' };
    return null; // handled per-layer
  };

  const shape = (node) => {
    const w = node.width, h = node.height;
    const sw = node.strokes && node.strokes.length ? node.strokeWeight : 0;
    const inset = node.type !== 'VECTOR' && node.strokeAlign === 'INSIDE' ? sw / 2 : 0;
    const x = inset, y = inset, ww = w - inset * 2, hh = h - inset * 2;
    const r = Math.max(0, (node.cornerRadius || 0) - inset);
    const mk = (extra) => {
      if (node.type === 'ELLIPSE') return '<ellipse cx="' + w / 2 + '" cy="' + h / 2 + '" rx="' + ww / 2 + '" ry="' + hh / 2 + '" ' + extra + '/>';
      if (node.type === 'VECTOR') {
        const o = node._off || { minx: 0, miny: 0 };
        return '<path transform="translate(' + -o.minx + ' ' + -o.miny + ')" d="' + node.vectorPaths[0].data + '" ' + extra + '/>';
      }
      return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, ww) + '" height="' + Math.max(0, hh) + '" rx="' + r + '" ' + extra + '/>';
    };
    let out = '';
    for (const p of node.fills || []) {
      if (p.visible === false) continue;
      const pt = paint(p, node);
      out += mk('fill="' + pt.fill + '" fill-opacity="' + pt.op + '"');
    }
    if (node.strokes && node.strokes.length) {
      const pt = paint(node.strokes[0], node);
      out += mk('fill="none" stroke="' + pt.fill + '" stroke-opacity="' + pt.op + '" stroke-width="' + sw + '"' + (node.strokeCap === 'ROUND' ? ' stroke-linecap="round"' : ''));
    }
    return out;
  };

  const textSvg = (node) => {
    const lines = node.characters.split('\n');
    const fam = FAMILY[node.fontName.family] || 'Arial';
    const bold = /Black|Bold/.test(node.fontName.style) ? ' font-weight="bold"' : '';
    const lh = node.lineHeight && node.lineHeight.unit === 'PIXELS' ? node.lineHeight.value : node.fontSize * 1.2;
    const ls = node.letterSpacing && node.letterSpacing.value ? ' letter-spacing="' + node.letterSpacing.value + '"' : '';
    const anchor = node.textAlignHorizontal === 'CENTER' ? 'middle' : node.textAlignHorizontal === 'RIGHT' ? 'end' : 'start';
    const tx = anchor === 'middle' ? node.width / 2 : anchor === 'end' ? node.width : 0;
    const pt = node.fills.length ? paint(node.fills[0], node) : { fill: '#fff', op: 1 };
    return lines.map((l, i) => '<text x="' + tx + '" y="' + (lh * i + lh / 2 + node.fontSize * 0.35) + '" text-anchor="' + anchor + '" font-family="' + fam + '" font-size="' + node.fontSize + '"' + bold + ls + ' fill="' + pt.fill + '" fill-opacity="' + pt.op + '" xml:space="preserve">' + l.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text>').join('');
  };

  let clipN = 0;
  const draw = (node) => {
    if (node.visible === false) return '';
    const tf = 'translate(' + fmt(node.x) + ' ' + fmt(node.y) + ')' + (node.rotation ? ' rotate(' + -node.rotation + ')' : '');
    let body = '';
    if (node.type === 'TEXT') body = textSvg(node);
    else {
      body = shape(node);
      const kids = node.children.map(draw).join('');
      if (kids) {
        if (node.clipsContent) {
          const id = prefix + 'c' + clipN++;
          defs += '<clipPath id="' + id + '"><rect width="' + node.width + '" height="' + node.height + '" rx="' + (node.cornerRadius || 0) + '"/></clipPath>';
          body += '<g clip-path="url(#' + id + ')">' + kids + '</g>';
        } else body += kids;
      }
    }
    const fa = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE' ? '' : fxAttr(node);
    const fb = fa || (node.type === 'TEXT' ? fxAttr(node) : '');
    return '<g transform="' + tf + '"' + (node.opacity !== 1 ? ' opacity="' + node.opacity + '"' : '') + fb + '>' + body + '</g>';
  };
  const inner = draw(Object.assign(Object.create(frame), { x: 0, y: 0 }));
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + frame.width + '" height="' + frame.height + '" viewBox="0 0 ' + frame.width + ' ' + frame.height + '"><defs>' + defs + '</defs>' + inner + '</svg>';
}

// ---- driver ---------------------------------------------------------------------
async function main() {
  const [outDir, ...rest] = process.argv.slice(2);
  const sheetAt = rest.indexOf('--sheet');
  const keys = sheetAt >= 0 ? rest.slice(0, sheetAt) : rest;
  const sheet = sheetAt >= 0 ? rest.slice(sheetAt + 1) : null;
  const code = fs.readFileSync(path.join(__dirname, '..', 'plugin', 'code.js'), 'utf8');
  const figma = makeFigma();
  const done = new Promise((res) => (figma._done = res));
  vm.runInNewContext(code, { figma, console });
  await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('plugin never closed')), 60000))]);
  console.log('plugin message:', figma.closed);

  const page = figma.currentPage;
  const frames = page.children.filter((n) => n.type === 'FRAME');
  const hot = page.findAll((n) => n.name.startsWith('hotspot'));
  console.log('frames', frames.length, 'hotspots', hot.length, 'with reactions', hot.filter((h) => h.reactions.length).length);
  const t = require('./selftest')(page);
  t.results.forEach((r) => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  got ' + r.got + ' want ' + r.want)));
  if (t.framesWithoutOxygenTimer.length) console.log('no oxygen timer on:', t.framesWithoutOxygenTimer.join(','));
  if (!outDir) return;
  fs.mkdirSync(outDir, { recursive: true });
  if (sheet) {
    const picked = sheet.map((k) => frames.find((f) => f.name.split(' · ')[0] === k)).filter(Boolean);
    const rows = Math.ceil(picked.length / 2);
    let body = '';
    picked.forEach((f, i) => {
      const svg = render(f, 's' + i + '_').replace(/^<svg [^>]*>/, '<svg x="' + (i % 2) * 720 + '" y="' + Math.floor(i / 2) * 450 + '" width="720" height="450" viewBox="0 0 1440 900">');
      body += svg;
    });
    const sheetSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="' + rows * 450 + '">' + body + '</svg>';
    const png = new Resvg(sheetSvg, { font: { loadSystemFonts: true } }).render().asPng();
    fs.writeFileSync(path.join(outDir, 'sheet_' + sheet[0] + '.png'), png);
    console.log('sheet written');
    return;
  }
  for (const f of frames) {
    const key = f.name.split(' · ')[0];
    if (keys.length && !keys.includes(key)) continue;
    const svg = render(f);
    const png = new Resvg(svg, { font: { loadSystemFonts: true }, fitTo: { mode: 'width', value: 1440 } }).render().asPng();
    fs.writeFileSync(path.join(outDir, key + '.png'), png);
  }
  console.log('rendered to', outDir);
}
main().catch((e) => { console.error(e); process.exit(1); });
