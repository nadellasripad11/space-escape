// ---- title + the three rooms (3d renders with live hotspots on top) -------------

function buildTitle() {
  const f = mk('title', '00 / Title', 0, 0);
  bgImage(f, 'title');
  rect(f, 0, 0, 980, 900, { fill: linear([[0, '#02050b', 0.78], [1, '#02050b', 0]], 0), name: 'text shade' });
  oxy(f, 120, 112, 118, 'happy');
  glass(f, 258, 150, 372, 70, { r: 22, op: 0.62, blur: 14, shadow: false, name: 'oxy bubble' });
  text(f, 280, 150, "hi! i'm oxy.\nkeep an eye on the air, ok?", { font: 'mono', size: 16, lh: 24, fill: C.white, name: 'oxy line' }).y = 168;
  text(f, 120, 262, 'A FIGMA ESCAPE ROOM', { font: 'mono', size: 16, fill: C.cyan, ls: 8, name: 'eyebrow' });
  text(f, 112, 300, 'OMEGA-7', { font: 'title', size: 150, fill: C.white, ls: 6, fx: [glow(C.cyan, 40, 0.35)], name: 'title' });
  text(f, 120, 500, 'You wake up alone.\nOxygen is falling. Find the escape pod.', { font: 'body', size: 26, lh: 40, fill: '#a9c3e6', name: 'tagline' });
  pill(f, 120, 640, 320, 76, 'WAKE UP  →', C.cyan, true);
  pill(f, 470, 640, 400, 76, 'PLAY LIVE IN 3D  ↗', C.cyan, false);
  go(hotspot(f, 470, 640, 400, 76, 'play live 3d'), 'https://nadellasripad11.github.io/space-escape/site/');
  text(f, 120, 770, 'Present mode.  Click everything.  Trust nothing.', { font: 'mono', size: 14, fill: '#8fa9cc', ls: 2, name: 'hint' });
  go(hotspot(f, 120, 640, 320, 76, 'wake up'), 'q1', { d: 0.9 });
}

// ---- QUARTERS ------------------------------------------------------------------
function buildQuarters(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  const R = REGIONS['quarters_' + s.state];
  bgImage(f, 'quarters_' + s.state);
  hud(f, 'SLEEPING QUARTERS', 18, s.held, 'hq');
  toast(f, s.toast, s.tone);

  go(hotRegion(f, R.bunk, 'bunk', 0), 'diary', PUSH);
  go(hotRegion(f, R.porthole, 'porthole', 8), 'porthole', PUSH);
  go(hotRegion(f, R.poster, 'crew poster', 10), 'poster', PUSH);
  go(hotRegion(f, R.vent, 'vent', 8), s.state === 'open' ? 'q2v' : s.state === 'empty' ? 'q3v' : 'q1v');
  if (s.state === 'closed') go(hotRegion(f, R.locker, 'locker', 6), 'q2');
  if (s.state === 'open') go(hotRegion(f, R.keycard, 'keycard', 34, 96), 'q3');
  if (s.state === 'empty') go(hotRegion(f, R.locker, 'locker (empty)', 6), 'q3l');
  if (s.held) go(hotRegion(f, R.door, 'door', 6), 'c1', { t: 'PUSH', dir: 'LEFT', d: 0.7, ease: 'EASE_IN_AND_OUT' });
  else go(hotRegion(f, R.door, 'door', 6), s.state === 'open' ? 'q2d' : 'q1d');
  lungs(f);
}

function buildAllQuarters() {
  const VENT = 'Too small to crawl through. Nothing in there but dust.';
  const LOCK = 'Magnetic lock. It wants a keycard.';
  buildQuarters('q1', '01 / Quarters', 0, 1, { state: 'closed', held: false, toast: 'Alarms. A throbbing head. Look around: something must open.' });
  buildQuarters('q1v', '01 / Quarters · vent', 1, 1, { state: 'closed', held: false, toast: VENT });
  buildQuarters('q1d', '01 / Quarters · locked door', 2, 1, { state: 'closed', held: false, toast: LOCK, tone: 'bad' });
  buildQuarters('q2', '02 / Quarters · locker open', 0, 2, { state: 'open', held: false, toast: 'The locker pops. Something is glinting on the shelf.', tone: 'good' });
  buildQuarters('q2v', '02 / Quarters · vent', 1, 2, { state: 'open', held: false, toast: VENT });
  buildQuarters('q2d', '02 / Quarters · locked door', 2, 2, { state: 'open', held: false, toast: LOCK, tone: 'bad' });
  buildQuarters('q3', '03 / Quarters · keycard', 0, 3, { state: 'empty', held: true, toast: 'KEYCARD ACQUIRED. LEVEL 2 CLEARANCE', tone: 'good' });
  buildQuarters('q3v', '03 / Quarters · vent', 1, 3, { state: 'empty', held: true, toast: VENT });
  buildQuarters('q3l', '03 / Quarters · empty locker', 2, 3, { state: 'empty', held: true, toast: 'Empty. A dent where the keycard used to be.' });
}

// ---- CONTROL ROOM ----------------------------------------------------------------
function buildControl(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  const R = REGIONS.control_sealed;
  bgImage(f, s.open ? 'control_open' : 'control_sealed');
  hud(f, 'CONTROL ROOM', 11, true, 'hc');
  toast(f, s.toast, s.tone);

  go(hotRegion(f, R.whiteboard, 'whiteboard', 8), 'whiteboard', PUSH);
  if (!s.open) {
    go(hotRegion(f, R.airlock, 'airlock', 4), 'c1a');
    go(hotRegion(f, R.terminal, 'terminal', 10), 'k0', PUSH);
  } else {
    go(hotRegion(f, R.airlock, 'airlock', 4), 'p1', { t: 'PUSH', dir: 'LEFT', d: 0.7, ease: 'EASE_IN_AND_OUT' });
  }
  lungs(f);
}

function buildAllControl() {
  buildControl('c1', '05 / Control room', 0, 4, { open: false, toast: 'Dead consoles. One terminal still has power.' });
  buildControl('c1a', '05 / Control room · airlock', 1, 4, { open: false, toast: 'Airlock sealed. The terminal must control it.', tone: 'bad' });
  buildControl('c2', '08 / Control room · airlock open', 2, 4, { open: true, toast: 'ACCESS GRANTED. Airlock seal released.', tone: 'good' });
}

// ---- POD BAY ---------------------------------------------------------------------------
function buildPod(key, name, col, row, s) {
  const f = mk(key, name, col, row);
  const R = REGIONS[s.ready ? 'pod_ready' : 'pod_dead'];
  bgImage(f, s.ready ? 'pod_ready' : 'pod_dead');
  hud(f, 'ESCAPE POD BAY', 5, true, 'hp');
  toast(f, s.toast, s.tone);

  if (s.ready) {
    go(hotRegion(f, R.hatch, 'hatch', 6), 'l3', { d: 0.3 });
    go(hotRegion(f, R.launchbtn, 'launch', 34, 110), 'l3', { d: 0.3 });
  } else {
    go(hotRegion(f, R.hatch, 'hatch', 6), 'p1h');
    go(hotRegion(f, R.panel, 'launch panel', 0), 'w0', PUSH);
  }
  go(hotRegion(f, R.manual, 'manual', 22, 90), 'manual', PUSH);
  lungs(f);
}

function buildAllPod() {
  buildPod('p1', '09 / Pod bay', 0, 6, { ready: false, toast: 'The pod is here, but its panel is dead. Three wires hang loose.' });
  buildPod('p1h', '09 / Pod bay · hatch', 1, 6, { ready: false, toast: 'Hatch is sealed. There is no power to the pod.', tone: 'bad' });
  buildPod('p2', '12 / Pod bay · powered', 2, 6, { ready: true, toast: 'ALL SYSTEMS ONLINE. Launch when ready.', tone: 'good' });
}
