// html for the readable objects (poster, whiteboard, log, porthole, manual, hints, about)
export const SYM = {
  circle: (c) => `<svg class="sym" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="${c}"/></svg>`,
  tri: (c) => `<svg class="sym" viewBox="0 0 36 36"><path d="M18 2 L34 34 L2 34 Z" fill="${c}"/></svg>`,
  square: (c) => `<svg class="sym" viewBox="0 0 36 36"><rect x="2" y="2" width="32" height="32" rx="4" fill="${c}"/></svg>`,
};

export const WIRES = [
  { name: 'RED', col: '#ff3b4e', sym: 'tri' },
  { name: 'BLUE', col: '#3b9bff', sym: 'square' },
  { name: 'YELLOW', col: '#ffd23b', sym: 'circle' },
];

const NAMES = ['M. OKAFOR', 'T. VASQUEZ', 'J. LINDQVIST', 'A. NAKAMURA', 'R. PETROV', 'S. ADEYEMI', 'K. HALVORSEN', 'L. FONTAINE'];

export const content = {
  poster: () => `
    <div class="poster paper">
      <div class="hd"><small>STATION OMEGA-7</small><b>CREW ROSTER</b></div>
      <ul>${NAMES.map((n, i) => `<li><span>BUNK 0${i + 1}</span>${n}<i></i></li>`).join('')}</ul>
      <div class="ft" style="position:relative"><small>ASSIGNED TO THIS STATION</small><b>8 / 8</b><em>CREW ABOARD<br>ALL ACCOUNTED FOR.</em></div>
    </div>`,

  whiteboard: () => `
    <div class="board">
      <h3>AIRLOCK 03 — NEW PIN</h3>
      <div class="formula">PIN = CREW × DECK</div>
      <p>Changed it AGAIN. Do NOT write it on your hand, Marcus.<br>If you can't remember, count the heads on the roster<br>and look at the sign.</p>
      <div class="ring"></div>
    </div>`,

  diary: () => `
    <div class="diary">
      <h3>LOG · M. OKAFOR</h3>
      <p><b>DAY 41</b>Coolant leak on deck 7 again.<br>Command calls it "nominal".</p>
      <p><b>DAY 42</b>Pin changed overnight. Third time<br>this week. Wrote the trick on the<br>whiteboard in the control room so I<br>stop locking myself out.</p>
      <p><b>DAY 44</b>Everyone took the lifeboats.<br>I stayed for the data. Bad call.</p>
    </div>`,

  porthole: () => `
    <div style="display:grid;justify-items:center">
      <div class="porthole"><i></i></div>
      <p class="cap">Below: a blue world. Somewhere down there a distress beacon is blinking.<br>Nobody is answering.</p>
    </div>`,

  manual: () => `
    <div class="manual">
      <div class="hd"><small>LIFEBOAT 2</small><b>EMERGENCY WIRING</b></div>
      <div class="rows">
        ${WIRES.map((w) => `<div class="row"><div class="tag" style="background:${w.col}">${w.name}</div><div class="run" style="background:${w.col}"></div><div class="port">${SYM[w.sym]('#e8f0f8')}</div></div>`).join('')}
      </div>
      <div class="warn">CROSS A WIRE AND THE POD SHORTS OUT.<br>CONNECT IN THE ORDER SHOWN: RED, BLUE, YELLOW.</div>
    </div>`,

  hint: (room) => {
    const H = {
      quarters: ['SLEEPING QUARTERS', ['Not everything you can open is a door.', 'Look closely at the locker, then at what you are carrying.', 'Some of the things on the wall are worth remembering.']],
      control: ['CONTROL ROOM', ['The terminal wants two digits.', 'One number is how many crew there were. The other is on a sign.', 'The whiteboard says what to do with them.']],
      pod: ['POD BAY', ['The panel is dead because three wires are unplugged.', 'The manual shows which symbol each color belongs to.', 'Connect them in the order the manual gives: red, blue, yellow.']],
    }[room] || ['STUCK?', ['Click the glowing things.', 'Read everything twice.']];
    return `<div class="panel glass hintcard"><div class="eb">NEED A NUDGE?</div><h2>${H[0]}</h2><ul>${H[1].map((l) => `<li>${l}</li>`).join('')}</ul><div class="foot">HINTS ARE FREE. OXYGEN IS NOT.</div></div>`;
  },

  about: () => `
    <div class="panel glass hintcard about">
      <div class="eb">THE WRONG TOOL</div>
      <h2>HOW THIS WAS BUILT</h2>
      <ul>
        <li>No game engine. Every room is a three.js scene made of boxes, lathes and canvas textures.</li>
        <li>The same scenes were rendered to images and built into a Figma prototype by a plugin script.</li>
        <li>Hover outlines, camera moves, the airlock, the locker and the launch are all live animation.</li>
        <li>Sound is synthesized in the browser. There are zero audio files.</li>
        <li>The oxygen timer is real. Seven minutes, like the Figma version's idle timers, but meaner.</li>
      </ul>
      <div class="foot">FIGMA · THREE.JS · WEBAUDIO</div>
    </div>`,
};
