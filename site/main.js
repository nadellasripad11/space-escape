import { Engine } from './engine.js';
import { createGame } from './game.js';
import { ui } from './ui.js';
import { audio } from './audio.js';
import { content } from './content.js';
import * as kit from '../render3d/kit.js';

const canvas = document.getElementById('gl');
const engine = new Engine(canvas);
const game = createGame(engine);

// handles for debugging / automated playthroughs
window.__omega = { engine, game, ui, audio, kit, act: (n) => game.interact(n, kit.getRegistry()[n]) };

let hoverName = null;
let pending = null;

function onMove(e) {
  engine.mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  pending = e;
}

function hoverTick() {
  const e = pending;
  pending = null;
  if (e && engine.scene && !game.S.busy && !ui.hasModal() && !game.S.over) {
    const hit = engine.pick(e.clientX, e.clientY);
    const name = hit ? hit.name : null;
    if (name !== hoverName) {
      hoverName = name;
      engine.setHover(hit);
      canvas.classList.toggle('hot', !!hit);
      if (hit) audio.hover();
    }
    if (hit) ui.tip(game.labels[name] || name.toUpperCase(), e.clientX, e.clientY);
    else ui.tipOff();
  } else if (e && (game.S.busy || ui.hasModal())) {
    if (hoverName) { hoverName = null; engine.setHover(null); canvas.classList.remove('hot'); ui.tipOff(); }
  }
  requestAnimationFrame(hoverTick);
}

canvas.addEventListener('pointermove', onMove);
canvas.addEventListener('pointerleave', () => { engine.mouse.set(0, 0); ui.tipOff(); });
canvas.addEventListener('click', (e) => {
  if (!engine.scene || game.S.busy || ui.hasModal()) return;
  const hit = engine.pick(e.clientX, e.clientY);
  if (hit) game.interact(hit.name, hit.object);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') ui.closeTop();
  else if (e.key === 'm' || e.key === 'M') toggleMute();
  else if ((e.key === 'h' || e.key === 'H') && game.S.running) game.hint();
});

function toggleMute() {
  audio.setMuted(!audio.muted);
  document.getElementById('mute').classList.toggle('off', audio.muted);
}
document.getElementById('mute').classList.toggle('off', audio.muted);
document.getElementById('mute').addEventListener('click', toggleMute);
document.getElementById('hint').addEventListener('click', () => game.hint());
document.getElementById('about').addEventListener('click', () => { audio.unlock(); audio.click(); ui.modal(content.about()); });
document.getElementById('start').addEventListener('click', () => game.start());

async function boot() {
  try {
    await engine.load('title', '');
    engine.markHome();
    engine.allowed = new Set();
    engine.run();
    requestAnimationFrame(hoverTick);
  } catch (err) {
    document.querySelector('#loading p').textContent = 'COULD NOT START WEBGL: ' + (err && err.message ? err.message : err);
    document.querySelector('#loading .spin').style.display = 'none';
    console.error(err);
    return;
  }
  document.getElementById('loading').classList.add('gone');
  const b = document.getElementById('start');
  b.disabled = false;
  b.textContent = 'WAKE UP  →';
}
boot();
