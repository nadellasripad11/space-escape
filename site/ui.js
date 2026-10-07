// dom layer: hud, toasts, tooltips, fades, modals
import { audio } from './audio.js';

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
    bd.innerHTML = '<div class="modal">' + (opts.sticky ? '' : '<button class="x" aria-label="close">✕</button>') + html + '</div>';
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
        bd.style.transition = 'opacity .25s';
        bd.style.opacity = '0';
        setTimeout(() => bd.remove(), 260);
        if (opts.onClose) opts.onClose();
      },
    };
    const x = bd.querySelector('.x');
    if (x) x.addEventListener('click', () => { audio.click(); handle.close(); });
    bd.addEventListener('pointerdown', (e) => { if (e.target === bd && !opts.sticky) handle.close(); });
    modals.push(handle);
    return handle;
  },
};
