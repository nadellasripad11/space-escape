// generative music: one little sequencer, one track per room, speeds up as the air runs out.
// no audio files, everything is synthesized with webaudio.
import { _ctx } from './audio.js';

const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
const rnd = Math.random;
const pick = (a) => a[Math.floor(rnd() * a.length)];

let bus = null;
let wet = null;
let noiseBuf = null;
let timer = 0;
let track = null;
let nextT = 0;
let step = 0;
let tempoMul = 1;
let drive = 0;
let enabled = true;
let wanted = null;
try { enabled = localStorage.getItem('omega7-music') !== '0'; } catch (e) { /* ignore */ }

function setup() {
  const { ctx, master } = _ctx();
  if (bus) return ctx;
  bus = ctx.createGain();
  bus.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 4200;
  bus.connect(lp).connect(master);
  // a soft echo so everything feels like it is in a big room
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.42;
  const fb = ctx.createGain();
  fb.gain.value = 0.36;
  wet = ctx.createGain();
  wet.gain.value = 0.3;
  const dlp = ctx.createBiquadFilter();
  dlp.type = 'lowpass';
  dlp.frequency.value = 1800;
  wet.connect(delay);
  delay.connect(dlp).connect(fb).connect(delay);
  dlp.connect(lp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

// ---- voices -----------------------------------------------------------------------
function env(g, t, a, hold, r, vol) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
}

const H = {
  e: 0.3,
  pad(notes, t, dur, vol) {
    const { ctx } = _ctx();
    for (const n of notes) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(380, t);
        f.frequency.linearRampToValueAtTime(900, t + dur * 0.6);
        const g = ctx.createGain();
        env(g, t, Math.min(0.9, dur * 0.25), Math.max(0.05, dur * 0.5), Math.min(1.4, dur * 0.4), (vol || 0.4) / (notes.length * 1.6));
        o.connect(f).connect(g);
        g.connect(bus);
        g.connect(wet);
        o.start(t);
        o.stop(t + dur * 1.2 + 1.6);
      }
    }
  },
  bass(n, t, dur, vol) {
    const { ctx } = _ctx();
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = mtof(n);
    const g = ctx.createGain();
    env(g, t, 0.02, dur * 0.4, dur * 0.6, vol || 0.5);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur * 1.2 + 0.2);
  },
  pluck(n, t, dur, vol) {
    const { ctx } = _ctx();
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = mtof(n);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.5));
    o.connect(f).connect(g);
    g.connect(bus);
    g.connect(wet);
    o.start(t);
    o.stop(t + (dur || 0.5) + 0.1);
  },
  bell(n, t, dur, vol) {
    const { ctx } = _ctx();
    for (const [mul, v] of [[1, 1], [2.01, 0.4], [3.98, 0.15]]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(n) * mul;
      const g = ctx.createGain();
      g.gain.setValueAtTime((vol || 0.25) * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.6));
      o.connect(g);
      g.connect(bus);
      g.connect(wet);
      o.start(t);
      o.stop(t + (dur || 1.6) + 0.1);
    }
  },
  kick(t, vol) {
    const { ctx } = _ctx();
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.3);
  },
  hat(t, vol) {
    const { ctx } = _ctx();
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f).connect(g).connect(bus);
    s.start(t);
    s.stop(t + 0.08);
  },
};

// ---- tracks (step = one eighth note) ------------------------------------------------------
const MINOR_A = [57, 60, 62, 64, 67, 69, 72, 76];
const DORIAN_D = [62, 64, 65, 67, 69, 71, 72, 74];
const PENT_C = [72, 74, 76, 79, 81, 84];

const TRACKS = {
  // dreamy music box: oxy's theme
  title: {
    bpm: 74,
    run(i, t) {
      const prog = [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [59, 62, 67]]];
      const bar = Math.floor(i / 8) % 4;
      const s = i % 8;
      const [root, ch] = prog[bar];
      if (s === 0) { H.pad(ch, t, H.e * 8, 0.5); H.bass(root, t, H.e * 4, 0.4); }
      if (s === 4) H.bass(root + 7, t, H.e * 3, 0.25);
      if (rnd() < (s % 2 ? 0.2 : 0.6)) H.bell(pick(PENT_C), t, 1.8, 0.2);
    },
  },
  // tense: heartbeat + minor pad + sparse high plucks
  quarters: {
    bpm: 84,
    run(i, t) {
      const prog = [[45, [57, 60, 64]], [41, [57, 60, 65]], [38, [57, 62, 65]], [40, [56, 59, 64]]];
      const bar = Math.floor(i / 16) % 4;
      const s = i % 16;
      const [root, ch] = prog[bar];
      if (s === 0) H.pad(ch, t, H.e * 16, 0.55);
      if (s === 0 || s === 5) H.kick(t, 0.5 + drive * 0.25);
      if (s === 1 || s === 6) H.kick(t, 0.28);
      if (s === 0) H.bass(root - 12, t, H.e * 6, 0.45);
      if (rnd() < 0.2 + drive * 0.3) H.pluck(pick(MINOR_A) + (rnd() < 0.3 ? 12 : 0), t, 0.7, 0.14);
      if (drive > 0.5 && s % 2 === 0) H.hat(t, 0.05 * drive);
    },
  },
  // calm and curious: dorian pad + rolling arpeggio
  control: {
    bpm: 92,
    run(i, t) {
      const prog = [[38, [50, 53, 57, 60]], [43, [50, 55, 58, 62]], [34, [53, 58, 62, 65]], [45, [52, 57, 60, 64]]];
      const bar = Math.floor(i / 16) % 4;
      const s = i % 16;
      const [root, ch] = prog[bar];
      if (s === 0) { H.pad(ch, t, H.e * 16, 0.5); H.bass(root, t, H.e * 7, 0.45); }
      if (s === 8) H.bass(root + 7, t, H.e * 4, 0.28);
      const arp = [0, 1, 2, 3, 2, 1, 2, 3];
      if (s % 2 === 0 || rnd() < 0.3) H.pluck(ch[arp[(s >> 1) % 8] % ch.length] + 12, t, 0.55, 0.16);
      if (rnd() < 0.08) H.bell(pick(DORIAN_D) + 12, t, 2, 0.1);
      if (drive > 0.6 && s % 4 === 0) H.kick(t, 0.25);
    },
  },
  // urgent: driving bass pulse, ticking hats, tempo scales with danger
  pod: {
    bpm: 104,
    run(i, t) {
      const prog = [[40, [52, 55, 59]], [36, [52, 55, 60]], [38, [54, 57, 62]], [35, [54, 59, 63]]];
      const bar = Math.floor(i / 16) % 4;
      const s = i % 16;
      const [root, ch] = prog[bar];
      if (s === 0) H.pad(ch, t, H.e * 16, 0.45);
      H.bass(root - (s % 4 === 2 ? 0 : 12), t, H.e * 0.9, 0.34 + drive * 0.12);
      if (s % 4 === 0) H.kick(t, 0.5);
      H.hat(t + (s % 2 ? H.e * 0.5 : 0), 0.05 + drive * 0.08);
      if (s % 2 === 1 && rnd() < 0.55) H.pluck(ch[Math.floor(rnd() * 3)] + 24, t, 0.35, 0.12);
    },
  },
  // triumphant: bright major pad + rising bells
  space: {
    bpm: 86,
    run(i, t) {
      const prog = [[38, [62, 66, 69]], [45, [61, 64, 69]], [47, [62, 66, 71]], [43, [62, 67, 71]]];
      const bar = Math.floor(i / 16) % 4;
      const s = i % 16;
      const [root, ch] = prog[bar];
      if (s === 0) { H.pad(ch, t, H.e * 16, 0.62); H.bass(root, t, H.e * 8, 0.4); }
      const up = [0, 1, 2, 1, 2, 3, 2, 3];
      if (s % 2 === 0) H.bell(ch[up[(s >> 1) % 8] % 3] + 12 + (s >= 8 ? 12 : 0), t, 1.4, 0.18);
      if (s === 0) H.kick(t, 0.35);
    },
  },
};

function tick() {
  const { ctx } = _ctx();
  if (!track) return;
  while (nextT < ctx.currentTime + 0.28) {
    H.e = 60 / (track.bpm * tempoMul) / 2;
    track.run(step, nextT);
    nextT += H.e;
    step++;
  }
}

export const music = {
  get current() { return track ? track.name : null; },
  get enabled() { return enabled; },
  play(name) {
    wanted = name;
    if (!enabled || !TRACKS[name]) { this.stop(); return; }
    const ctx = setup();
    if (track && track.name === name) return;
    this.stop(true);
    track = Object.assign({ name }, TRACKS[name]);
    step = 0;
    nextT = ctx.currentTime + 0.12;
    tempoMul = 1;
    drive = 0;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(0.2, ctx.currentTime, 0.9);
    timer = setInterval(tick, 60);
  },
  stop(quick) {
    clearInterval(timer);
    timer = 0;
    track = null;
    if (bus) {
      const { ctx } = _ctx();
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0.0001, ctx.currentTime, quick ? 0.15 : 0.6);
    }
  },
  // 0 = relaxed, 1 = about to suffocate
  setIntensity(v) {
    drive = Math.max(0, Math.min(1, v));
    tempoMul = 1 + drive * 0.32;
  },
  setEnabled(on) {
    enabled = on;
    try { localStorage.setItem('omega7-music', on ? '1' : '0'); } catch (e) { /* ignore */ }
    if (on) { if (wanted) this.play(wanted); } else this.stop();
  },
};
