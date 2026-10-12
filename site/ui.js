// dom layer: hud, toasts, tooltips, fades, modals
import { audio } from './audio.js';
import { MASCOT } from './mascot-data.js';

const $ = (s) => document.querySelector(s);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let toastTimer = 0;
let zc = 25;
const modals = [];

export const ui = {
  $,
  toast(msg, tone, ms) {
    const t = $('#toast');
    t.className = '';
    void t.offsetWidth;
    t.textContent = msg;
    t.className = 'on ' + (tone || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, ms || 3800);
  },
  setRoom(label) { $('#room').textContent = '//  ' + label; },
  setO2(frac, secs) {
    const pct = Math.max(0, Math.round(frac * 100));
    $('#o2fill').style.width = pct + '%';
    $('#o2pct').textContent = pct + '%';
    const s = Math.max(0, Math.ceil(secs));
    $('#clock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    const low = frac < 0.25;
    $('.hud-right').classList.toggle('low', low);
    $('#tint').classList.toggle('on', low);
  },
  setCard(has) { $('#slot0').innerHTML = has ? '<div class="card-ico"></div>' : ''; },
  setFuse(has) { $('#slot1').innerHTML = has ? '<div class="fuse-ico"></div>' : ''; },
  flyItem(x, y, kind) {
    return new Promise((resolve) => {
      const c = document.createElement('div');
      c.className = kind === 'fuse' ? 'fuse-ico' : 'card-ico';
      c.style.cssText = 'position:fixed;z-index:50;left:' + (x - 22) + 'px;top:' + (y - 14) + 'px;transition:all .8s cubic-bezier(.5,0,.2,1);pointer-events:none';
      document.body.appendChild(c);
      const dest = kind === 'fuse' ? $('#slot1') : $('#slot0');
      const r = dest.getBoundingClientRect();
      requestAnimationFrame(() => {
        c.style.left = r.left + r.width / 2 - 22 + 'px';
        c.style.top = r.top + r.height / 2 - 14 + 'px';
        c.style.transform = 'rotate(360deg) scale(0.95)';
      });
      setTimeout(() => { c.remove(); resolve(); }, 850);
    });
  },
  flyCard(x, y) {
    return new Promise((resolve) => {
      const c = document.createElement('div');
      c.className = 'card-ico';
      c.style.cssText = 'position:fixed;z-index:50;left:' + (x - 26) + 'px;top:' + (y - 16) + 'px;transition:all .8s cubic-bezier(.5,0,.2,1);pointer-events:none';
      document.body.appendChild(c);
      const r = $('#slot0').getBoundingClientRect();
      requestAnimationFrame(() => {
        c.style.left = r.left + r.width / 2 - 26 + 'px';
        c.style.top = r.top + r.height / 2 - 16 + 'px';
        c.style.transform = 'rotate(360deg) scale(0.95)';
      });
      setTimeout(() => { c.remove(); resolve(); }, 850);
    });
  },
  tip(text, x, y) {
    const t = $('#tip');
    t.textContent = text;
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    t.classList.add('on');
  },
  tipOff() { $('#tip').classList.remove('on'); },
  showGuide(on) {
    const g = $('#guide');
    if (on) { g.hidden = false; void g.offsetWidth; g.classList.add('on'); }
    else { g.classList.remove('on'); setTimeout(() => { if (!g.classList.contains('on')) g.hidden = true; }, 360); }
  },
  renderGuide(data) {
    const g = $('#guide');
    g.querySelector('.guide-steps').innerHTML = data.steps.map((s, i) => {
      const cls = s.done ? 'done' : i === data.current ? 'current' : 'todo';
      return `<li class="${cls}"><span class="gs-mark"></span><span class="gs-label">${s.label}</span></li>`;
    }).join('');
    g.querySelector('.guide-count').textContent = data.doneCount + '/' + data.steps.length;
    const now = g.querySelector('.guide-now');
    g.querySelector('.guide-now-text').textContent = data.now || '';
    now.classList.toggle('hide', !data.now);
  },
  guidePulse(on) {
    const g = $('#guide');
    const was = g.classList.contains('nudge');
    g.classList.toggle('nudge', !!on);
    if (was !== !!on) g.querySelector('.guide-now-ico').innerHTML = MASCOT[on ? 'worried' : 'idle'];
  },
  guideCollapsed() { return $('#guide').classList.contains('collapsed'); },
  toggleGuide(force) {
    const g = $('#guide');
    const collapsed = force != null ? force : !g.classList.contains('collapsed');
    g.classList.toggle('collapsed', collapsed);
    g.querySelector('.guide-toggle').textContent = collapsed ? '+' : '–';
    try { localStorage.setItem('omega7-guide-collapsed', collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
    return collapsed;
  },
  async fade(on, ms) {
    const f = $('#fade');
    f.style.transitionDuration = (ms || 400) + 'ms';
    f.classList.toggle('on', on);
    await sleep(ms || 400);
  },
  async flash(ms) {
    const f = $('#flash');
    f.style.transition = 'none';
    f.style.opacity = '1';
    await sleep(60);
    f.style.transition = 'opacity ' + (ms || 900) + 'ms ease-out';
    f.style.opacity = '0';
    await sleep(ms || 900);
  },
  eyes() {
    const e = $('#eyes');
    e.className = 'open';
    setTimeout(() => { e.className = ''; }, 2800);
  },
  countdown(n) {
    const c = $('#countdown');
    if (n == null) { c.classList.remove('on'); return; }
    c.classList.add('on');
    c.innerHTML = '<span>' + n + '</span>';
  },
  showTitle(on) { $('#title').classList.toggle('gone', !on); },
  showHud(on) { $('#hud').hidden = !on; },
  hasModal() { return modals.length > 0; },
  closeTop() {
    const m = modals[modals.length - 1];
    if (m && !m.sticky) { m.close(); return true; }
    return false;
  },
  modal(html, opts) {
    opts = opts || {};
    const root = $('#modal-root');
    const bd = document.createElement('div');
    bd.className = 'backdrop';
    bd.style.zIndex = ++zc;
    bd.innerHTML = '<div class="modal">' + (opts.sticky ? '' : '<button class="x" aria-label="close">&#x2715;</button>') + html + '</div>';
    root.appendChild(bd);
    let closed = false;
    const handle = {
      el: bd.querySelector('.modal'),
      sticky: !!opts.sticky,
      close() {
        if (closed) return;
        closed = true;
        const i = modals.indexOf(handle);
        if (i >= 0) modals.splice(i, 1);
        bd.style.transition = 'opacity .3s';
        bd.style.opacity = '0';
        setTimeout(() => bd.remove(), 310);
        if (opts.onClose) opts.onClose();
      },
    };
    const x = bd.querySelector('.x');
    if (x) x.addEventListener('click', () => { audio.click(); handle.close(); });
    bd.addEventListener('pointerdown', (e) => { if (e.target === bd && !opts.sticky) handle.close(); });
    modals.push(handle);
    // 3d tilt: panel rotates to follow the cursor like a holographic card
    attachTilt(bd);
    // particle burst for win/lose end cards
    if (bd.querySelector('.endcard')) spawnParticles(bd);
    return handle;
  },
  lastModal() { return modals[modals.length - 1] || null; },
};

// ---- 3d tilt on any panel inside a backdrop ---------------------------------
function attachTilt(bd) {
  const panel = bd.querySelector('.panel, .keypad, .wiring, .fusebox-panel, .diary, .poster, .board, .manual');
  if (!panel) return;
  let raf = 0;
  let tx = 0, ty = 0;
  const move = (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = panel.getBoundingClientRect();
      if (!r.width) return;
      const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      tx += (x * 7 - tx) * 0.18;
      ty += (-y * 5 - ty) * 0.18;
      panel.style.transform = `perspective(1400px) rotateY(${tx}deg) rotateX(${ty}deg) scale3d(1.018,1.018,1.018)`;
    });
  };
  const leave = () => {
    cancelAnimationFrame(raf);
    const ease = () => {
      tx *= 0.82; ty *= 0.82;
      panel.style.transform = (Math.abs(tx) + Math.abs(ty) > 0.05)
        ? `perspective(1400px) rotateY(${tx}deg) rotateX(${ty}deg) scale3d(1,1,1)`
        : '';
      if (Math.abs(tx) + Math.abs(ty) > 0.05) raf = requestAnimationFrame(ease);
    };
    raf = requestAnimationFrame(ease);
  };
  bd.addEventListener('mousemove', move);
  bd.addEventListener('mouseleave', leave);
}

// ---- floating particle burst for end-of-game cards -------------------------
function spawnParticles(bd) {
  const isWin = !!bd.querySelector('.endcard [style*="--green"]') || !bd.querySelector('[style*="--red"]');
  const colors = isWin ? ['#27d3ff', '#3dff9a', '#ffffff', '#a8f0ff'] : ['#ff3b4e', '#ff8090', '#ffb020'];
  for (let i = 0; i < 38; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random() * 8;
    const col = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const dist = 120 + Math.random() * 260;
    const dur = 900 + Math.random() * 1100;
    const delay = Math.random() * 400;
    p.style.cssText = `
      width:${size}px;height:${size}px;background:${col};
      box-shadow:0 0 ${size * 2}px ${col};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      position:fixed;pointer-events:none;z-index:9999;
      left:50%;top:50%;
      transform:translate(-50%,-50%);
      animation:particle-fly ${dur}ms ${delay}ms cubic-bezier(0,.9,1,1) forwards;
      --dx:${Math.cos(angle * Math.PI / 180) * dist}px;
      --dy:${Math.sin(angle * Math.PI / 180) * dist}px;
    `;
    bd.appendChild(p);
    setTimeout(() => p.remove(), dur + delay + 100);
  }
}
