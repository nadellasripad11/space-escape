// the game: rooms, objects, puzzles, oxygen, launch
import * as kit from '../render3d/kit.js';
import { audio } from './audio.js';
import { ui, sleep } from './ui.js';
import { content } from './content.js';
import { openKeypad, openWiring } from './puzzles.js';

const TOTAL = 420; // seconds of air

export function createGame(engine) {
  const S = {
    room: 'title',
    locker: 'closed', // closed | open | empty
    hasCard: false,
    pinOk: false,
    airlockOpen: false,
    powered: false,
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
    terminal: 'TERMINAL', whiteboard: 'WHITEBOARD', airlock: 'AIRLOCK', decksign: 'DECK SIGN',
    manual: 'MANUAL', panel: 'CONTROL PANEL', hatch: 'HATCH', launchbtn: 'LAUNCH',
  };
  const ROOM_LABEL = { quarters: 'SLEEPING QUARTERS', control: 'CONTROL ROOM', pod: 'ESCAPE POD BAY', space: 'OPEN SPACE' };

  const names = () => {
    if (S.room === 'quarters') return ['bunk', 'porthole', 'poster', 'vent', 'locker', 'door'].concat(S.locker === 'open' ? ['keycard'] : []);
    if (S.room === 'control') return ['terminal', 'whiteboard', 'airlock', 'decksign'];
    if (S.room === 'pod') return ['manual', 'panel', 'hatch'].concat(S.powered ? ['launchbtn'] : []);
    return [];
  };
  const refreshAllowed = () => { engine.allowed = new Set(S.over || S.launching ? [] : names()); };
  const obj = (n) => kit.getRegistry()[n];

  async function enterRoom(room) {
    S.room = room;
    audio.alarm(false);
    audio.hum(false);
    let scene = room;
    let state = '';
    if (room === 'quarters') state = S.locker === 'open' ? 'open' : S.hasCard ? 'empty' : 'closed';
    if (room === 'control') state = S.airlockOpen ? 'open' : 'sealed';
    if (room === 'pod') state = S.powered ? 'ready' : 'dead';
    await engine.load(scene, state);
    engine.markHome();
    refreshAllowed();
    ui.setRoom(ROOM_LABEL[room] || '');
    if (room === 'quarters') audio.alarm(true);
    else if (room !== 'space') audio.hum(true);
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
    switch (key) {
      case 'quarters:locker':
        if (S.locker === 'closed') {
          S.busy = true;
          audio.thunk();
          await engine.api.openLocker();
          S.locker = 'open';
          audio.good();
          ui.toast('The locker pops. Something is glinting on the shelf.', 'good');
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
        S.busy = false;
        break;
      }
      case 'quarters:door':
        if (!S.hasCard) {
          audio.bad();
          engine.shake = 0.06;
          ui.toast('Magnetic lock. It wants a keycard.', 'bad');
        } else {
          audio.good();
          ui.toast('Keycard accepted. The door slides open.', 'good', 1800);
          await goto('control', o);
        }
        break;
      case 'quarters:vent': ui.toast('Too small to crawl through. Nothing in there but dust.'); break;
      case 'quarters:poster': await closeup(o, content.poster(), { dist: 2.1 }); break;
      case 'quarters:bunk': await closeup(o, content.diary(), { dist: 3.2 }); break;
      case 'quarters:porthole': await closeup(o, content.porthole(), { dist: 2.0 }); break;

      case 'control:whiteboard': await closeup(o, content.whiteboard(), { dist: 2.3 }); break;
      case 'control:decksign': ui.toast('DECK 07'); break;
      case 'control:airlock':
        if (!S.airlockOpen) {
          audio.bad();
          engine.shake = 0.05;
          ui.toast('Airlock sealed. The terminal must control it.', 'bad');
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
          const ok = await openKeypad(ui);
          if (!ok) { engine.reset(650); break; }
          S.busy = true;
          S.pinOk = true;
          engine.api.setTerminal(['> AIRLOCK 03', '> VERIFYING PIN...', '> PIN OK', '> _']);
          await engine.reset(700);
          audio.thunk();
          ui.toast('ACCESS GRANTED. Airlock seal released.', 'good');
          await engine.api.openAnimated();
          S.airlockOpen = true;
          S.busy = false;
        }
        break;

      case 'pod:manual': await closeup(o, content.manual(), { dist: 2.0 }); break;
      case 'pod:hatch':
        if (!S.powered) { audio.bad(); engine.shake = 0.05; ui.toast('Hatch is sealed. There is no power to the pod.', 'bad'); }
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

  function win() {
    S.over = true;
    S.running = false;
    audio.hum(false);
    audio.good();
    const st = stats();
    let best = st.time;
    try {
      const prev = Number(localStorage.getItem('omega7-best') || 0);
      if (!prev || st.time < prev) localStorage.setItem('omega7-best', String(st.time));
      best = Math.min(prev || st.time, st.time);
    } catch (e) { /* ignore */ }
    ui.modal(`
      <div class="panel glass endcard">
        <div class="eb" style="color:var(--green)">ESCAPE SUCCESSFUL</div>
        <h2>YOU MADE IT.</h2>
        <p>Station Omega-7 came apart four minutes later.<br>You were the only survivor.</p>
        <div class="stats"><div><b>${mmss(st.time)}</b>TIME</div><div><b>${mmss(st.left)}</b>AIR LEFT</div><div><b>${st.hints}</b>HINTS</div><div><b>${mmss(best)}</b>BEST</div></div>
        <div class="row"><button class="btn green" id="again">PLAY AGAIN</button><a class="btn ghost" href="https://github.com/nadellasripad11/space-escape" target="_blank" rel="noopener">SOURCE ↗</a></div>
      </div>`, { sticky: true }).el.querySelector('#again').addEventListener('click', () => location.reload());
  }

  async function lose() {
    S.over = true;
    S.running = false;
    refreshAllowed();
    audio.alarm(false);
    audio.hum(false);
    audio.rumble(false);
    audio.bad();
    ui.countdown(null);
    await ui.fade(true, 1400);
    const m = ui.modal(`
      <div class="panel glass endcard" style="border-color:rgba(255,59,78,.6)">
        <div class="eb" style="color:var(--red)">O2 0%</div>
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
    await enterRoom('quarters');
    S.running = true;
    ui.eyes();
    await ui.fade(false, 150);
    ui.toast('Alarms. A throbbing head. Look around: something must open.', null, 5200);
    S.busy = false;
  }

  function hint() {
    if (S.over || S.launching || ui.hasModal()) return;
    S.hints++;
    audio.click();
    ui.modal(content.hint(S.room === 'pod' ? 'pod' : S.room === 'control' ? 'control' : 'quarters'));
  }

  engine.onFrame = (dt) => {
    if (!S.running || S.over || S.room === 'space') return;
    if (!S.launching) S.o2 -= dt;
    if (S.o2 <= 0) { S.o2 = 0; lose(); }
    ui.setO2(S.o2 / TOTAL, S.o2);
  };

  return { S, start, interact, hint, labels: LABELS, refreshAllowed, enterRoom, win, lose, engine, ui, names };
}
