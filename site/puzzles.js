// the two live puzzles: airlock keypad and drag-a-wire pod panel
import { audio } from './audio.js';
import { content, SYM, WIRES } from './content.js';

const PIN = '56';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// resolves true when the pin is right, false if the player closes it first
export function openKeypad(ui) {
  return new Promise((resolve) => {
    let entered = '';
    let locked = false;
    let done = false;
    const html = `
      <div class="panel glass keypad">
        <div class="hd">AIRLOCK 03 &nbsp;·&nbsp; PIN ENTRY</div>
        <div class="disp"><div class="dots"><i></i><i></i></div></div>
        <div class="sub">ENTER THE 2-DIGIT PIN</div>
        <div class="keys">
          ${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => `<button class="key" data-k="${d}">${d}</button>`).join('')}
          <button class="key clr" data-k="clr">CLR</button><button class="key" data-k="0">0</button><button class="key blank"></button>
        </div>
      </div>`;
    const m = ui.modal(html, {
      onClose: () => { if (!done) { done = true; document.removeEventListener('keydown', onKey); resolve(false); } },
    });
    const root = m.el.querySelector('.keypad');
    const dots = [...m.el.querySelectorAll('.dots i')];
    const sub = m.el.querySelector('.sub');
    const disp = m.el.querySelector('.disp');
    const paint = () => dots.forEach((d, i) => d.classList.toggle('f', i < entered.length));

    async function press(k) {
      if (locked) return;
      if (k === 'clr') { entered = ''; paint(); audio.click(); return; }
      if (entered.length >= 2) return;
      entered += k;
      audio.key();
      paint();
      if (entered.length === 2) {
        locked = true;
        await sleep(260);
        if (entered === PIN) {
          root.classList.add('ok');
          disp.innerHTML = 'ACCESS GRANTED';
          sub.textContent = 'SEAL RELEASED';
          audio.good();
          await sleep(1100);
          done = true;
          document.removeEventListener('keydown', onKey);
          m.close();
          resolve(true);
        } else {
          root.classList.add('deny');
          sub.textContent = 'WRONG PIN · RESETTING';
          audio.bad();
          await sleep(900);
          root.classList.remove('deny');
          sub.textContent = 'ENTER THE 2-DIGIT PIN';
          entered = '';
          paint();
          locked = false;
        }
      }
    }
    m.el.querySelectorAll('.key[data-k]').forEach((b) => b.addEventListener('click', () => press(b.dataset.k)));
    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete') press('clr');
    }
    document.addEventListener('keydown', onKey);
  });
}

// drag the glowing plug onto the matching port. wrong port: short circuit, start over
export function openWiring(ui) {
  return new Promise((resolve) => {
    const portKinds = ['circle', 'tri', 'square']; // top to bottom
    const wireTarget = [1, 2, 0]; // red -> triangle, blue -> square, yellow -> circle
    const ys = [90, 230, 370];
    let stage = 0;
    let drag = null;
    let busy = false;
    let done = false;

    const svgPort = (kind, cx, cy, c) => {
      if (kind === 'circle') return `<circle cx="${cx}" cy="${cy}" r="17" fill="${c}"/>`;
      if (kind === 'tri') return `<path d="M${cx} ${cy - 19} L${cx + 19} ${cy + 17} L${cx - 19} ${cy + 17} Z" fill="${c}"/>`;
      return `<rect x="${cx - 16}" y="${cy - 16}" width="32" height="32" rx="4" fill="${c}"/>`;
    };

    const html = `
      <div class="panel glass wiring">
        <div class="top"><span class="title">POD POWER &nbsp;·&nbsp; MANUAL WIRING</span><span class="instr" id="instr"></span></div>
        <svg viewBox="0 0 900 470" id="wsvg">
          <defs><filter id="gl"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <g id="runs"></g>
          ${WIRES.map((w, i) => `
            <g class="plug" data-i="${i}" id="plug${i}" style="color:${w.col}">
              <rect x="40" y="${ys[i] - 42}" width="104" height="84" rx="16" fill="${w.col}" id="src${i}"/>
              <text x="92" y="${ys[i] + 12}" text-anchor="middle" font-family="Orbitron" font-weight="900" font-size="34" fill="#10131c">${w.name[0]}</text>
            </g>`).join('')}
          ${portKinds.map((k, p) => `
            <g id="portg${p}">
              <rect class="port" id="port${p}" x="720" y="${ys[p] - 46}" width="150" height="92" rx="18" fill="rgba(7,16,30,0.7)" stroke="rgba(159,196,255,0.35)" stroke-width="2"/>
              <g id="psym${p}">${svgPort(k, 795, ys[p], '#e8f4ff')}</g>
            </g>`).join('')}
          <path id="live" d="" fill="none" stroke-width="12" stroke-linecap="round" filter="url(#gl)" opacity="0"/>
        </svg>
        <div class="foot"><span class="hintline">drag the glowing plug onto its port</span><button class="mini" id="man">OPEN MANUAL</button></div>
      </div>`;
    const m = ui.modal(html, { onClose: () => { if (!done) { done = true; resolve(false); } } });
    const el = m.el;
    const svg = el.querySelector('#wsvg');
    const runs = el.querySelector('#runs');
    const live = el.querySelector('#live');
    const instr = el.querySelector('#instr');
    const panel = el.querySelector('.wiring');

    const wirePath = (x1, y1, x2, y2) => `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
    const toSvg = (e) => { const r = svg.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 900, y: ((e.clientY - r.top) / r.height) * 470 }; };

    function refresh() {
      WIRES.forEach((w, i) => {
        const g = el.querySelector('#plug' + i);
        const active = i === stage && !busy;
        g.style.opacity = i < stage ? '1' : active ? '1' : '0.4';
        g.classList.toggle('active', active);
        g.style.cursor = active ? 'grab' : 'default';
        if (i >= stage && i !== stage) el.querySelector('#src' + i).setAttribute('fill-opacity', '0.5');
        else el.querySelector('#src' + i).setAttribute('fill-opacity', '1');
      });
      if (stage < 3) {
        instr.textContent = 'CONNECT THE ' + WIRES[stage].name + ' WIRE';
        instr.style.color = WIRES[stage].col;
        instr.style.textShadow = '0 0 18px ' + WIRES[stage].col;
      }
    }

    function portAt(pt) {
      for (let p = 0; p < 3; p++) {
        const y = ys[p];
        if (pt.x > 700 && pt.x < 890 && pt.y > y - 56 && pt.y < y + 56) return p;
      }
      return -1;
    }

    async function attempt(p) {
      busy = true;
      const w = WIRES[stage];
      if (p === wireTarget[stage]) {
        audio.good();
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', wirePath(144, ys[stage], 720, ys[p]));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', w.col);
        path.setAttribute('stroke-width', '12');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('filter', 'url(#gl)');
        runs.appendChild(path);
        const port = el.querySelector('#port' + p);
        port.classList.add('used');
        el.querySelector('#psym' + p).innerHTML = svgPort(portKinds[p], 795, ys[p], '#3dff9a');
        live.setAttribute('opacity', '0');
        stage++;
        busy = false;
        refresh();
        if (stage === 3) {
          instr.textContent = 'POD POWERED';
          instr.style.color = '#3dff9a';
          await sleep(1000);
          done = true;
          m.close();
          resolve(true);
        }
      } else {
        audio.spark();
        panel.classList.add('short');
        instr.textContent = 'SHORT CIRCUIT · RESETTING';
        instr.style.color = '#ff3b4e';
        live.setAttribute('opacity', '0');
        await sleep(900);
        panel.classList.remove('short');
        runs.innerHTML = '';
        for (let q = 0; q < 3; q++) {
          el.querySelector('#port' + q).classList.remove('used');
          el.querySelector('#psym' + q).innerHTML = svgPort(portKinds[q], 795, ys[q], '#e8f4ff');
        }
        stage = 0;
        busy = false;
        refresh();
      }
    }

    // pointer drag from the active plug
    el.querySelectorAll('.plug').forEach((g) => {
      g.addEventListener('pointerdown', (e) => {
        const i = Number(g.dataset.i);
        if (busy || i !== stage) return;
        e.preventDefault();
        g.setPointerCapture && g.setPointerCapture(e.pointerId);
        drag = { i };
        live.setAttribute('stroke', WIRES[i].col);
        live.setAttribute('opacity', '1');
        const pt = toSvg(e);
        live.setAttribute('d', wirePath(144, ys[i], pt.x, pt.y));
        audio.click();
      });
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const pt = toSvg(e);
      live.setAttribute('d', wirePath(144, ys[drag.i], pt.x, pt.y));
      const p = portAt(pt);
      for (let q = 0; q < 3; q++) el.querySelector('#port' + q).classList.toggle('hot', q === p);
    });
    const release = (e) => {
      if (!drag) return;
      const pt = toSvg(e);
      const p = portAt(pt);
      drag = null;
      for (let q = 0; q < 3; q++) el.querySelector('#port' + q).classList.remove('hot');
      if (p >= 0) attempt(p);
      else live.setAttribute('opacity', '0');
    };
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);
    // click fallback: click a port while a plug is idle
    el.querySelectorAll('[id^=portg]').forEach((g) => g.addEventListener('click', () => {
      if (busy || drag) return;
      attempt(Number(g.id.slice(5)));
    }));
    el.querySelector('#man').addEventListener('click', () => { audio.click(); ui.modal(content.manual()); });
    refresh();
  });
}
