// ---- launch sequence + endings ----------------------------------------------------

function buildCountdown(key, name, col, n) {
  const f = mk(key, name, col, 8);
  bgImage(f, 'pod_ready');
  dim(f, n === 1 ? 0.5 : 0.42, n === 1 ? '#2a0508' : '#02050b');
  text(f, 0, 40, 'LAUNCH IN', { font: 'mono', size: 20, fill: '#b9cfee', ls: 12, w: W, align: 'CENTER', name: 'label' });
  const c = n === 1 ? C.red : C.cyan;
  text(f, 0, 70, String(n), { font: 'title', size: 230, fill: c, w: W, align: 'CENTER', fx: [glow(c, 60, 0.55)], name: 'count' });
  after(f, 0.9, n === 1 ? 'la' : n === 3 ? 'l2' : 'l1', { d: 0.1 });
}

function buildLaunch(key, name, col, gone) {
  const f = mk(key, name, col, 8);
  bgImage(f, 'space');
  if (gone) {
    for (let i = 0; i < 14; i++) rect(f, 100 + i * 90, 120 + ((i * 137) % 640), 300 + (i % 4) * 90, 2, { fill: C.white, op: 0.25 + (i % 3) * 0.12, name: 'speed line' });
  }
  rect(f, gone ? 1250 : -250, 0, 1440, 900, { fill: imagePaint('podsprite'), name: 'pod' });
  after(f, gone ? 0.3 : 0.25, gone ? 'win' : 'lb', gone ? { d: 0.9 } : { t: 'SMART_ANIMATE', d: 1.7, ease: 'EASE_IN' });
}

function buildWin() {
  const f = mk('win', '13 / You made it', 1, 0);
  bgImage(f, 'space');
  dim(f, 0.25);
  text(f, 0, 190, 'ESCAPE SUCCESSFUL', { font: 'mono', size: 18, fill: C.green, ls: 10, w: W, align: 'CENTER', name: 'eyebrow' });
  text(f, 0, 230, 'YOU MADE IT.', { font: 'title', size: 150, fill: C.white, ls: 4, w: W, align: 'CENTER', fx: [glow(C.green, 50, 0.35)], name: 'title' });
  text(f, 0, 420, 'Station Omega-7 came apart four minutes later.\nYou were the only survivor.', { font: 'body', size: 28, lh: 42, fill: '#c3d6f0', w: W, align: 'CENTER', name: 'epilogue' });
  pill(f, 560, 560, 320, 76, 'PLAY AGAIN', C.green, true);
  text(f, 0, 740, 'how this was built  →', { font: 'mono', size: 15, fill: C.cyan, ls: 4, w: W, align: 'CENTER', name: 'about link' });
  text(f, 0, 840, 'built in figma  ·  rendered in 3d  ·  the wrong tool', { font: 'mono', size: 13, fill: '#a9c3e6', ls: 4, w: W, align: 'CENTER', name: 'credit' });
  text(f, 0, 780, 'play the live 3D version  ↗', { font: 'mono', size: 15, fill: C.green, ls: 4, w: W, align: 'CENTER', name: 'live link' });
  go(hotspot(f, 480, 768, 480, 44, 'play live 3d'), 'https://nadellasripad11.github.io/space-escape/site/');
  go(hotspot(f, 520, 728, 400, 44, 'about'), 'about', { d: 0.3 });
  go(hotspot(f, 560, 560, 320, 76, 'play again'), 'title', { d: 0.6 });
}

function buildLose() {
  const f = mk('lose', '14 / Oxygen depleted', 2, 0);
  const b = bgImage(f, 'quarters_closed');
  b.effects = [{ type: 'LAYER_BLUR', radius: 8, visible: true }];
  dim(f, 0.78, '#2a0508');
  text(f, 0, 270, 'O2  0%', { font: 'mono', size: 18, fill: C.red, ls: 10, w: W, align: 'CENTER', name: 'eyebrow' });
  text(f, 0, 310, 'OXYGEN DEPLETED', { font: 'title', size: 110, fill: C.red, ls: 4, w: W, align: 'CENTER', fx: [glow(C.red, 50, 0.5)], name: 'title' });
  text(f, 0, 460, 'You stopped moving. The station did not.', { font: 'body', size: 28, fill: '#c3d6f0', w: W, align: 'CENTER', name: 'sub' });
  pill(f, 560, 560, 320, 76, 'TRY AGAIN', C.red, true);
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
