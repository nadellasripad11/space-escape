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
    for (let y = 0; y < H; y += 4) rect(c, 0, y, W, 1, { fill: '#000000', op: 0.16, name: 'scan' });
    rect(c, 0, 0, W, H, {
      fill: radial([
        [0.55, '#000000', 0],
        [1, '#000000', 0.8],
      ]),
      name: 'vignette',
    });
    if (alert) {
      rect(c, 0, 0, W, H, {
        fill: radial([
          [0.45, C.red, 0],
          [1, C.red, 0.32],
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
