// the game: rooms, objects, puzzles, oxygen, launch
import * as kit from '../render3d/kit.js';
import { audio } from './audio.js';
import { ui, sleep } from './ui.js';
import { content } from './content.js';
import { oxy } from './oxy.js';
import { buddy } from './buddy.js';
import { music } from './music.js';
import { openKeypad, openWiring, openCrateLock, openFuseBox } from './puzzles.js';

const DIFFICULTY = {
  easy:   { total: 600, label: 'EASY',   o2mul: 0.7,  hintPenalty: 0 },
  normal: { total: 420, label: 'NORMAL', o2mul: 1.0,  hintPenalty: 0 },
  hard:   { total: 300, label: 'HARD',   o2mul: 1.35, hintPenalty: 1 },
};

export function createGame(engine) {
  let diff = 'normal';
  try { diff = localStorage.getItem('omega7-diff') || 'normal'; } catch (e) { /* ignore */ }
  if (!DIFFICULTY[diff]) diff = 'normal';
  const D = DIFFICULTY[diff];
  const TOTAL = D.total;

  const S = {
    room: 'title',
    diff,
    locker: 'closed', // closed | open | empty
    hasCard: false,
    pinOk: false,
    airlockOpen: false,
    powered: false,
    crateOpen: false,      // new quarters crate combo-lock
    hasFusePart: false,    // item from crate
    fuseFixed: false,      // new reactor fuse-box puzzle
    o2: TOTAL,
    hints: 0,
    busy: false,
    over: false,
    running: false,
    launching: false,
    log: [],
  };

  const LABELS = {
    bunk: 'BUNK', porthole: 'PORTHOLE', poster: 'CREW ROSTER', vent: 'VENT', locker: 'LOCKER', door: 'DOOR', keycard: 'KEYCARD',
    crate: 'STORAGE CRATE', fusepart: 'FUSE PART',
    terminal: 'TERMINAL', whiteboard: 'WHITEBOARD', airlock: 'AIRLOCK', decksign: 'DECK SIGN', fusebox: 'FUSE BOX',
    manual: 'MANUAL', panel: 'CONTROL PANEL', hatch: 'HATCH', launchbtn: 'LAUNCH',
  };
  const LOOKS = new Set(['poster', 'bunk', 'porthole', 'whiteboard', 'manual']);
  const ROOM_LABEL = { quarters: 'SLEEPING QUARTERS', control: 'CONTROL ROOM', pod: 'ESCAPE POD BAY', space: 'OPEN SPACE' };

  const names = () => {
    if (S.room === 'quarters') {
      const base = ['bunk', 'porthole', 'poster', 'vent', 'locker', 'crate', 'door'];
      if (S.locker === 'open') base.push('keycard');
      if (S.crateOpen && !S.hasFusePart) base.push('fusepart');
      return base;
    }
    if (S.room === 'control') {
      const base = ['terminal', 'whiteboard', 'airlock', 'decksign'];
      if (!S.fuseFixed) base.push('fusebox');
      return base;
    }
    if (S.room === 'pod') return ['manual', 'panel', 'hatch'].concat(S.powered ? ['launchbtn'] : []);
    return [];
  };
  const refreshAllowed = () => { engine.allowed = new Set(S.over || S.launching ? [] : names()); };
  const obj = (n) => kit.getRegistry()[n];

  async function enterRoom(room) {
    S.room = room;
    let scene = room;
    let state = '';
    if (room === 'quarters') state = S.locker === 'open' ? 'open' : S.hasCard ? 'empty' : 'closed';
    if (room === 'control') state = S.airlockOpen ? 'open' : 'sealed';
    if (room === 'pod') state = S.powered ? 'ready' : 'dead';
    await engine.load(scene, state);
    engine.markHome();
    refreshAllowed();
    ui.setRoom(ROOM_LABEL[room] || '');
    audio.ambience(room);
    music.play(room);
  }

  async function goto(room, fromObj) {
    S.busy = true;
    audio.whoosh();
    if (fromObj) {
      const p = engine.focus(fromObj, 1.1, 900);
      await sleep(520);
      ui.fade(true, 420);
      await p;
    } else await ui.fade(true, 420);
    await enterRoom(room);
    await ui.fade(false, 700);
    S.busy = false;
  }

  async function closeup(o, html, opts) {
    opts = opts || {};
    S.busy = true;
    audio.whoosh();
    await engine.focus(o, opts.dist || 2.3, 750);
    S.busy = false;
    ui.modal(html, { onClose: () => { engine.reset(650); } });
  }

  async function interact(name, o) {
    if (S.busy || S.over || ui.hasModal() || S.launching) return;
    audio.click();
    const key = S.room + ':' + name;
    S.log.push(key);
    if (LOOKS.has(name)) buddy.event('look:' + name);
    switch (key) {
      case 'quarters:locker':
        if (S.locker === 'closed') {
          S.busy = true;
          audio.clang();
          await engine.api.openLocker();
          S.locker = 'open';
          audio.good();
          ui.toast('The locker pops. Something is glinting on the shelf.', 'good');
          buddy.event('locker');
          S.busy = false;
          refreshAllowed();
        } else if (S.locker === 'open') ui.toast('Something is glinting on the shelf. Take it.');
        else ui.toast('Empty. A dent where the keycard used to be.');
        break;
      case 'quarters:keycard': {
        S.busy = true;
        audio.pickup();
        const sp = engine.screenPos(o);
        engine.api.takeCard();
        S.locker = 'empty';
        S.hasCard = true;
        refreshAllowed();
        await ui.flyCard(sp.x, sp.y);
        ui.setCard(true);
        audio.good();
        ui.toast('KEYCARD ACQUIRED. LEVEL 2 CLEARANCE', 'good');
        buddy.event('keycard');
        S.busy = false;
        break;
      }
      case 'quarters:door':
        if (!S.hasCard) {
          audio.bad();
          engine.shake = 0.06;
          ui.toast('Magnetic lock. It wants a keycard.', 'bad');
          buddy.event('doorLocked');
        } else {
          audio.good();
          ui.toast('Keycard accepted. The door slides open.', 'good', 1800);
          audio.hiss(0.8);
          buddy.event('doorOpen');
          await goto('control', o);
        }
        break;
      case 'quarters:vent': ui.toast('Too small to crawl through. Nothing in there but dust.'); buddy.event('vent'); break;
      case 'quarters:crate':
        if (S.crateOpen && !S.hasFusePart) ui.toast('A fuse part is still sitting in there. Take it.');
        else if (S.crateOpen && S.hasFusePart) ui.toast('Empty crate. No more room for sentiment.');
        else {
          S.busy = true;
          audio.whoosh();
          await engine.focus(o, 2.0, 750);
          S.busy = false;
          buddy.event('crate');
          const ok = await openCrateLock(ui);
          if (!ok) { engine.reset(650); break; }
          S.crateOpen = true;
          if (engine.api.openCrate) engine.api.openCrate();
          audio.clang();
          audio.good();
          ui.toast('The crate clicks open. A fuse part inside.', 'good');
          refreshAllowed();
        }
        break;
      case 'quarters:fusepart': {
        S.busy = true;
        audio.pickup();
        const sp = engine.screenPos(o);
        S.hasFusePart = true;
        if (engine.api.takeFuse) engine.api.takeFuse();
        refreshAllowed();
        await ui.flyItem(sp.x, sp.y, 'fuse');
        ui.setFuse(true);
        audio.good();
        ui.toast('FUSE PART ACQUIRED. The control room may need this.', 'good');
        buddy.event('fusePickup');
        S.busy = false;
        break;
      }
      case 'quarters:poster': await closeup(o, content.poster(), { dist: 2.1 }); break;
      case 'quarters:bunk': await closeup(o, content.diary(), { dist: 3.2 }); break;
      case 'quarters:porthole': await closeup(o, content.porthole(), { dist: 2.0 }); break;

      case 'control:whiteboard': await closeup(o, content.whiteboard(), { dist: 2.3 }); break;
      case 'control:decksign': ui.toast('DECK 07'); break;
      case 'control:fusebox':
        if (!S.hasFusePart) {
          audio.bad(); engine.shake = 0.05;
          ui.toast('The fuse box is open but needs a fuse part. Look in the quarters.', 'bad');
          buddy.event('fuseNoPart');
        } else if (S.fuseFixed) {
          ui.toast('POWER RESTORED. The lights are steady.', 'good');
        } else {
          S.busy = true;
          audio.whoosh();
          await engine.focus(o, 2.0, 750);
          S.busy = false;
          buddy.event('fusebox');
          const ok = await openFuseBox(ui);
          if (!ok) { engine.reset(650); break; }
          S.busy = true;
          S.fuseFixed = true;
          if (engine.api.setFuse) engine.api.setFuse(true);
          refreshAllowed();
          await engine.reset(700);
          audio.good();
          audio.spark();
          ui.toast('POWER RESTORED. Lights humming again.', 'good');
          buddy.event('fuseFixed');
          S.busy = false;
        }
        break;
      case 'control:airlock':
        if (!S.airlockOpen) {
          audio.bad();
          engine.shake = 0.05;
          ui.toast('Airlock sealed. The terminal must control it.', 'bad');
          buddy.event('airlockSealed');
        } else {
          await goto('pod', o);
        }
        break;
      case 'control:terminal':
        if (S.pinOk) { ui.toast('AIRLOCK 03: OPEN'); break; }
        S.busy = true;
        audio.whoosh();
        await engine.focus(o, 1.9, 750);
        S.busy = false;
        {
          buddy.event('keypad');
          const ok = await openKeypad(ui);
          if (!ok) { engine.reset(650); break; }
          S.busy = true;
          S.pinOk = true;
          engine.api.setTerminal(['> AIRLOCK 03', '> VERIFYING PIN...', '> PIN OK', '> _']);
          await engine.reset(700);
          audio.thunk();
          audio.servo();
          audio.hiss(1.0);
          buddy.event('pinRight');
          ui.toast('ACCESS GRANTED. Airlock seal released.', 'good');
          await engine.api.openAnimated();
          S.airlockOpen = true;
          S.busy = false;
        }
        break;

      case 'pod:manual': await closeup(o, content.manual(), { dist: 2.0 }); break;
      case 'pod:hatch':
        if (!S.powered) { audio.bad(); engine.shake = 0.05; ui.toast('Hatch is sealed. There is no power to the pod.', 'bad'); buddy.event('hatchLocked'); }
        else await launch();
        break;
      case 'pod:launchbtn': await launch(); break;
      case 'pod:panel':
        if (S.powered) { ui.toast('POD READY. Launch when you are.', 'good'); break; }
        S.busy = true;
        audio.whoosh();
        await engine.focus(o, 3.0, 750);
        S.busy = false;
        {
          buddy.event('wiring');
          const ok = await openWiring(ui);
          if (!ok) { engine.reset(650); break; }
          S.busy = true;
          S.powered = true;
          await engine.reset(700);
          engine.api.setReady(true);
          audio.good();
          ui.toast('ALL SYSTEMS ONLINE. Launch when ready.', 'good');
          refreshAllowed();
          S.busy = false;
        }
        break;
      default: break;
    }
  }

  async function launch() {
    S.busy = true;
    S.launching = true;
    refreshAllowed();
    const api = engine.api;
    audio.alarm(false);
    buddy.event('launch');
    await engine.focus(api.pod, 5.2, 1000);
    api.pod.userData.flame.visible = true;
    audio.rumble(true);
    for (const n of [3, 2, 1]) {
      ui.countdown(n);
      audio.beep(n === 1);
      engine.shake = 0.012 * (4 - n) + 0.01;
      await sleep(1000);
    }
    ui.countdown(null);
    engine.shake = 0.1;
    await sleep(350);
    ui.flash(1200);
    S.room = 'space';
    ui.setRoom(ROOM_LABEL.space);
    await engine.load('space', '');
    engine.markHome();
    audio.whoosh();
    await engine.api.fly();
    audio.rumble(false);
    win();
  }

  function stats() {
    const used = Math.round(TOTAL - S.o2);
    return { time: used, left: Math.max(0, Math.round(S.o2)), hints: S.hints };
  }
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  function makeShareText(st, bestTime, stars) {
    const starStr = '*'.repeat(stars) + ' '.repeat(3 - stars);
    const newBest = bestTime >= st.time;
    const lines = [
      'OMEGA-7 · 3D Escape Room',
      'Escaped in ' + mmss(st.time) + '  [' + starStr + ']',
      'Air left: ' + mmss(st.left) + '  Hints: ' + st.hints + '  Mode: ' + D.label,
      newBest ? 'New personal best!' : '',
      '',
      'play → https://nadellasripad11.github.io/space-escape/site/',
      '#wrongtool #hackclub',
    ];
    return lines.filter((l, i, a) => l || (a[i - 1] && a[i + 1])).join('\n');
  }

  function starCount(st) {
    if (st.hints === 0 && st.time < TOTAL * 0.6) return 3;
    if (st.hints <= 1 && st.time < TOTAL * 0.85) return 2;
    return 1;
  }

  function loadBoard() {
    try { return JSON.parse(localStorage.getItem('omega7-lb') || '[]'); } catch (e) { return []; }
  }
  function saveBoard(entry) {
    let lb = loadBoard();
    lb.push(entry);
    lb.sort((a, b) => a.time - b.time);
    lb = lb.slice(0, 5);
    try { localStorage.setItem('omega7-lb', JSON.stringify(lb)); } catch (e) { /* ignore */ }
    return lb;
  }
  function renderBoard(lb, highlightIdx) {
    if (!lb.length) return '';
    const rows = lb.map((e, i) => {
      const cls = i === highlightIdx ? ' class="lb-you"' : '';
      const stars = e.stars === 3 ? '***' : e.stars === 2 ? '**' : '*';
      return `<tr${cls}><td class="lb-rank">${i + 1}</td><td>${mmss(e.time)}</td><td>${e.diff ? e.diff.toUpperCase() : 'NORMAL'}</td><td class="lb-stars">${stars}</td></tr>`;
    }).join('');
    return `<div class="lb-wrap"><table class="lb"><thead><tr><th>#</th><th>TIME</th><th>MODE</th><th>RATING</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function win() {
    S.over = true;
    S.running = false;
    ui.showGuide(false);
    buddy.show(false);
    audio.ambience('none');
    audio.hum(false);
    audio.win();
    music.stop();
    const st = stats();
    const stars = starCount(st);
    const entry = { time: st.time, hints: st.hints, stars, diff };
    const lb = saveBoard(entry);
    const youIdx = lb.findIndex((e) => e.time === st.time && e.diff === diff && e.stars === stars);
    const isNewBest = youIdx === 0;
    const starStr = stars === 3 ? 'THREE STARS' : stars === 2 ? 'TWO STARS' : 'ONE STAR';
    const starDots = '&#x2605;'.repeat(stars) + '&#x2606;'.repeat(3 - stars);
    ui.modal(`
      <div class="panel glass endcard has-oxy">
        ${oxy('happy', 128, 'oxy-top')}
        <div class="eb" style="color:var(--green)">ESCAPE SUCCESSFUL</div>
        <h2>YOU MADE IT.</h2>
        <div class="star-row">${starDots}</div>
        <p class="star-label">${starStr}${isNewBest ? ' &nbsp;&mdash;&nbsp; NEW BEST' : ''}</p>
        <p>Station Omega-7 came apart four minutes later.<br>You were the only survivor.</p>
        <div class="stats">
          <div><b>${mmss(st.time)}</b>TIME</div>
          <div><b>${mmss(st.left)}</b>AIR LEFT</div>
          <div><b>${st.hints}</b>HINTS</div>
          <div><b>${D.label}</b>DIFFICULTY</div>
        </div>
        ${renderBoard(lb, youIdx)}
        <div class="row"><button class="btn green" id="again">PLAY AGAIN</button><button class="btn ghost" id="share">SHARE</button><a class="btn ghost" href="https://github.com/nadellasripad11/space-escape" target="_blank" rel="noopener">SOURCE</a></div>
      </div>`, { sticky: true });
    const winModal = ui.lastModal();
    winModal.el.querySelector('#again').addEventListener('click', () => location.reload());
    winModal.el.querySelector('#share').addEventListener('click', async () => {
      const shareText = makeShareText(st, lb[0] ? lb[0].time : st.time, stars);
      const btn = winModal.el.querySelector('#share');
      try {
        if (navigator.share && navigator.canShare && navigator.canShare({ text: shareText })) {
          await navigator.share({ text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          btn.textContent = 'COPIED';
          setTimeout(() => { btn.textContent = 'SHARE'; }, 1900);
        }
      } catch (e) { /* user cancelled or no clipboard */ }
    });
  }

  async function lose() {
    S.over = true;
    S.running = false;
    ui.showGuide(false);
    buddy.show(false);
    music.stop();
    audio.ambience('none');
    refreshAllowed();
    audio.alarm(false);
    audio.hum(false);
    audio.rumble(false);
    audio.bad();
    ui.countdown(null);
    await ui.fade(true, 1400);
    const m = ui.modal(`
      <div class="panel glass endcard has-oxy" style="border-color:rgba(255,59,78,.6)">
        ${oxy('dizzy', 128, 'oxy-top')}<div class="eb" style="color:var(--red)">O2 0%</div>
        <h2 style="color:var(--red)">OXYGEN DEPLETED</h2>
        <p>You stopped moving. The station did not.</p>
        <div class="row"><button class="btn red" id="again">TRY AGAIN</button></div>
      </div>`, { sticky: true });
    m.el.querySelector('#again').addEventListener('click', () => location.reload());
  }

  async function start() {
    audio.unlock();
    audio.click();
    S.busy = true;
    ui.showTitle(false);
    await ui.fade(true, 700);
    ui.showHud(true);
    ui.showGuide(true);
    await enterRoom('quarters');
    S.running = true;
    ui.eyes();
    await ui.fade(false, 150);
    ui.toast('Alarms. A throbbing head. Look around: something must open.', null, 5200);
    buddy.show(true);
    buddy.event('start');
    S.busy = false;
  }

  function hint() {
    if (S.over || S.launching || ui.hasModal()) return;
    S.hints++;
    if (D.hintPenalty) { S.o2 = Math.max(0, S.o2 - 30); }
    audio.click();
    ui.modal(content.hint(S.room === 'pod' ? 'pod' : S.room === 'control' ? 'control' : 'quarters'));
  }

  // the full objective list for the bottom-screen guide widget. each step flips
  // to done straight off game state, so the widget tracks real progress.
  function steps() {
    const reached = { quarters: 0, control: 1, pod: 2, space: 3 }[S.room];
    const r = reached == null ? 0 : reached;
    const list = [
      { label: 'Open the locker', done: S.locker !== 'closed' },
      { label: 'Take the keycard', done: S.hasCard },
      { label: 'Crack the storage crate lock', done: S.crateOpen },
      { label: 'Retrieve the fuse part', done: S.hasFusePart },
      { label: 'Unlock the quarters door', done: r >= 1 },
      { label: 'Repair the fuse box', done: S.fuseFixed },
      { label: 'Crack the terminal PIN', done: S.pinOk },
      { label: 'Pass through the airlock', done: r >= 2 },
      { label: 'Reconnect the pod wiring', done: S.powered },
      { label: 'Launch the escape pod', done: r >= 3 },
    ];
    let current = list.findIndex((s) => !s.done);
    if (current < 0) current = list.length - 1;
    const doneCount = list.filter((s) => s.done).length;
    return { steps: list, current, doneCount, now: nudge() };
  }

  // a short, state-aware line telling the player how to do the current step.
  // returns null when they are clearly mid-action (busy / a puzzle or reading modal is open).
  function nudge() {
    if (!S.running || S.over || S.busy || S.launching || ui.hasModal()) return null;
    if (S.room === 'quarters') {
      if (S.locker === 'closed') return 'Look around and click what glows. Try the locker and the storage crate.';
      if (!S.hasCard) return 'Something is glinting on the locker shelf. Click it to take the keycard.';
      if (!S.crateOpen) return 'There is a locked storage crate here. The combination might be in the diary.';
      if (!S.hasFusePart) return 'A fuse part is sitting in the open crate. Take it.';
      return 'You have the keycard and the fuse part. The door will let you through now.';
    }
    if (S.room === 'control') {
      if (!S.fuseFixed && S.hasFusePart) return 'The fuse box is open and broken. Use the fuse part you picked up.';
      if (!S.fuseFixed) return 'Something is wrong with the power. There is a fuse box in here — check the quarters for a spare part.';
      if (!S.pinOk) return 'The terminal needs a PIN. Read the whiteboard — it tells you how to work it out.';
      if (!S.airlockOpen) return 'PIN accepted. Click the airlock to head for the escape pod.';
      return 'The airlock is open. Click it to step through to the pod bay.';
    }
    if (S.room === 'pod') {
      if (!S.powered) return 'The pod is dead. The control panel needs its wires reconnected — the manual shows the order.';
      return 'All systems online. Click LAUNCH (or the hatch) when you are ready to go.';
    }
    return 'Move the mouse to look around and click anything that glows. Press ? any time for a hint.';
  }

  engine.onFrame = (dt) => {
    if (!S.running || S.over || S.room === 'space') return;
    if (!S.launching) S.o2 -= dt * D.o2mul;
    if (!S.said50 && S.o2 < TOTAL * 0.5) { S.said50 = true; buddy.event('o2_50'); }
    if (!S.said25 && S.o2 < TOTAL * 0.25) { S.said25 = true; buddy.event('o2_25'); }
    if (!S.said10 && S.o2 < TOTAL * 0.1) { S.said10 = true; buddy.event('o2_10'); }
    music.setIntensity(1 - S.o2 / TOTAL);
    if (S.o2 <= 0) { S.o2 = 0; lose(); }
    ui.setO2(S.o2 / TOTAL, S.o2);
  };

  function setDifficulty(d) {
    if (!DIFFICULTY[d]) return;
    diff = d;
    try { localStorage.setItem('omega7-diff', d); } catch (e) { /* ignore */ }
  }

  return { S, start, interact, hint, nudge, steps, labels: LABELS, refreshAllowed, enterRoom, win, lose, engine, ui, names, setDifficulty, getDiff: () => diff };
}
