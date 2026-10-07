// oxy as a live companion: a little face that talks, reacts and nudges you when you are stuck
import { MASCOT } from './mascot-data.js';
import { audio } from './audio.js';

const LINES = {
  start: ["you're awake! those alarms are so loud...", 'worried'],
  locker: ["ooh, something's shiny in there!", 'happy'],
  keycard: ['level 2 clearance! fancy!', 'happy'],
  doorLocked: ["it's locked... maybe it wants a keycard?", 'worried'],
  doorOpen: ["off we go! stay close to me!", 'happy'],
  vent: ["i don't think anyone fits in there...", 'idle'],
  'look:poster': ['eight crew... count the names carefully!', 'idle'],
  'look:bunk': ["that's somebody's log. poor marcus...", 'worried'],
  'look:porthole': ['the planet is so pretty from here.', 'happy'],
  'look:whiteboard': ['crew times deck... i like math!', 'happy'],
  'look:manual': ['a manual! manuals are my favorite.', 'happy'],
  airlockSealed: ["it's sealed. the terminal must control it!", 'worried'],
  keypad: ['two digits... you can do this!', 'happy'],
  pinWrong: ['oops, not that one!', 'worried'],
  pinRight: ['yay!! the airlock is unlocking!', 'happy'],
  wiring: ['wires! color matching, my favorite.', 'happy'],
  wireShort: ['zzzt! eep! start over!', 'dizzy'],
  wired: ['the pod is waking up!', 'happy'],
  hatchLocked: ['no power to the pod yet...', 'worried'],
  launch: ['3... 2... 1... hold on tight!', 'happy'],
  o2_50: ["halfway through our air. no pressure!", 'idle'],
  o2_25: ['the air is getting low... hurry!', 'worried'],
  o2_10: ['i feel a little dizzy...', 'dizzy'],
};

const HOVER = {
  poster: 'ooh, a crew list!',
  whiteboard: 'somebody left a note...',
  terminal: 'that screen still has power!',
  locker: 'hmm, that locker looks interesting.',
  porthole: 'we are so high up!',
  bunk: 'somebody slept here. messy!',
  vent: 'too small, even for me.',
  door: 'that door has a card reader.',
  airlock: "the airlock... don't open it without the pin!",
  manual: 'a manual! manuals are good.',
  panel: 'that panel looks dead...',
  hatch: 'our ride is right there!',
  launchbtn: 'the big green button!!',
  keycard: 'grab it, grab it!',
};

const POKES = ['hehe, that tickles!', "i'm keeping watch!", "you're doing great!", 'want a hint? press h!', 'beep boop. (that means hi.)'];

let hideT = 0;
let typeT = 0;
let prioNow = 0;
let until = 0;
let lastHover = 0;
let seen = new Set();
let lastLine = '';

const root = () => document.getElementById('buddy');
const face = () => root().querySelector('.buddy-face');

export const buddy = {
  show(on) { root().hidden = !on; },
  mood(expr) { face().innerHTML = MASCOT[expr || 'idle']; },
  say(text, expr, o) {
    o = o || {};
    const prio = o.prio == null ? 1 : o.prio;
    const now = performance.now();
    if (now < until && prio < prioNow) return false;
    const r = root();
    if (r.hidden) return false;
    prioNow = prio;
    const dur = o.ms || Math.max(3200, 1500 + text.length * 55);
    until = now + dur;
    clearTimeout(hideT);
    clearInterval(typeT);
    const bub = r.querySelector('.buddy-bubble');
    bub.textContent = '';
    r.classList.add('speaking', 'talking');
    this.mood(expr);
    let i = 0;
    typeT = setInterval(() => {
      i++;
      bub.textContent = text.slice(0, i);
      if (i % 3 === 1) audio.chirp(expr);
      if (i >= text.length) { clearInterval(typeT); r.classList.remove('talking'); }
    }, 34);
    hideT = setTimeout(() => {
      r.classList.remove('speaking', 'talking');
      this.mood('idle');
      prioNow = 0;
    }, dur);
    return true;
  },
  event(name) {
    const l = LINES[name];
    if (!l) return;
    this.say(l[0], l[1], { prio: name.startsWith('o2_') || name === 'launch' ? 2 : 1 });
  },
  // a quiet comment the first time you hover something
  hover(name) {
    const now = performance.now();
    if (seen.has(name) || now - lastHover < 9000 || now < until || !HOVER[name]) return;
    seen.add(name);
    lastHover = now;
    this.say(HOVER[name], 'idle', { prio: 0.3 });
  },
  poke() {
    let l = pick(POKES);
    if (l === lastLine) l = pick(POKES);
    lastLine = l;
    audio.click();
    this.say(l, 'happy', { prio: 0.5 });
  },
};

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
