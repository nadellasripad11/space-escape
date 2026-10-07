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

