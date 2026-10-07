// tiny synthesized sound kit (webaudio, no files): ui blips, alarm, ambience, launch rumble
let ctx = null;
let master = null;
let muted = false;
let alarmNodes = null;
let humNodes = null;
let rumbleNodes = null;

try { muted = localStorage.getItem('omega7-muted') === '1'; } catch (e) { /* ignore */ }

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

function noiseBuffer(sec) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function blip(freq, dur, type, vol, slideTo, when) {
  if (!ensure()) return;
  const t = ctx.currentTime + (when || 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const audio = {
  unlock: ensure,
  get muted() { return muted; },
  setMuted(m) {
    muted = m;
    try { localStorage.setItem('omega7-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
  },
  hover() { blip(1400, 0.05, 'sine', 0.05); },
  click() { blip(520, 0.07, 'square', 0.08, 380); },
  key() { blip(880, 0.05, 'triangle', 0.12); },
  good() { blip(660, 0.12, 'sine', 0.16); blip(880, 0.12, 'sine', 0.16, null, 0.1); blip(1320, 0.22, 'sine', 0.16, null, 0.2); },
  bad() { blip(180, 0.28, 'sawtooth', 0.16, 90); },
  beep(high) { blip(high ? 1200 : 760, 0.18, 'square', 0.14); },
  pickup() { blip(500, 0.1, 'triangle', 0.16, 1000); blip(1000, 0.16, 'triangle', 0.14, 1500, 0.08); },
  whoosh() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(1.2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  },
  thunk() { blip(110, 0.35, 'sine', 0.4, 45); },
  spark() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    src.connect(g).connect(master);
    src.start(t);
    blip(2200, 0.2, 'sawtooth', 0.1, 300);
  },
  alarm(on) {
    if (!ensure()) return;
    if (on && !alarmNodes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = 330;
      lfo.frequency.value = 0.8;
      lg.gain.value = 120;
      lfo.connect(lg).connect(o.frequency);
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.03, ctx.currentTime, 1.2);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700;
      o.connect(lp).connect(g).connect(master);
      o.start(); lfo.start();
      alarmNodes = { o, lfo, g };
    } else if (!on && alarmNodes) {
      const n = alarmNodes;
      alarmNodes = null;
      n.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      setTimeout(() => { n.o.stop(); n.lfo.stop(); }, 1200);
    }
  },
  hum(on) {
    if (!ensure()) return;
    if (on && !humNodes) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(3);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.18, ctx.currentTime, 1.5);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 55;
      const og = ctx.createGain();
      og.gain.value = 0.05;
      src.connect(lp).connect(g).connect(master);
      o.connect(og).connect(master);
      src.start(); o.start();
      humNodes = { src, o, g, og };
    } else if (!on && humNodes) {
      const n = humNodes;
      humNodes = null;
      n.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      n.og.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      setTimeout(() => { n.src.stop(); n.o.stop(); }, 1200);
    }
  },
  rumble(on) {
    if (!ensure()) return;
    if (on && !rumbleNodes) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(3);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(90, ctx.currentTime);
      lp.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 3.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 3);
      src.connect(lp).connect(g).connect(master);
      src.start();
      rumbleNodes = { src, g };
    } else if (!on && rumbleNodes) {
      const n = rumbleNodes;
      rumbleNodes = null;
      n.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.8);
      setTimeout(() => n.src.stop(), 3000);
    }
  },
};
