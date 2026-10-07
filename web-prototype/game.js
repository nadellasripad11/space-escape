// game state
const state = {
  hasKeycard: false,
  lockerOpened: false,
  passwordSolved: false,
  airlockOpen: false,
  selectedWire: null,
  connections: {},      // wire -> port
  wireSolved: false,
};

// correct wire mapping: A->1, B->2, C->3
const CORRECT = { A: '1', B: '2', C: '3' };

function goto(sceneId) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  document.getElementById(sceneId).classList.add('active');
}

function log(id, msg) {
  document.getElementById(id).innerHTML = '> ' + msg;
}

function updateInventory() {
  const bars = ['inventory-bar', 'inventory-bar2'];
  bars.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = state.hasKeycard
      ? '<div class="inv-item">🪪 KEYCARD</div>'
      : '';
  });
}

// ROOM 1 -------------------------------------------------------

function clickLocker() {
  if (state.lockerOpened) {
    log('log', 'The locker is empty.');
    return;
  }
  state.lockerOpened = true;
  state.hasKeycard = true;
  document.getElementById('locker').classList.add('used');
  document.getElementById('locker').querySelector('.item-icon').textContent = '📂';
  log('log', 'You pry it open. A keycard falls out — CREW ACCESS LEVEL 2.');
  updateInventory();
}

function clickVent() {
  log('log', 'Too small to crawl through. You\'d suffocate before you got halfway.');
}

function clickDoor1() {
  if (!state.hasKeycard) {
    log('log', 'Magnetic lock. You need a keycard.');
    return;
  }
  log('log', 'The keycard reader beeps green. The door slides open.');
  setTimeout(() => goto('scene-control'), 800);
}

// ROOM 2 -------------------------------------------------------

let whiteboardRead = false;

function clickTerminal() {
  document.getElementById('terminal-input').classList.remove('hidden');
  log('log2', 'Terminal is live. Waiting for password...');
}

function clickWhiteboard() {
  whiteboardRead = true;
  log('log2', '"LAUNCH CODES ROTATE DAILY. TODAY = CREW COUNT × DECK NUMBER. CREW: 8. DECK: 7."');
}

function submitPassword() {
  const val = document.getElementById('password-field').value.trim().toUpperCase();
  if (val === '56') {
    state.passwordSolved = true;
    document.getElementById('terminal-input').classList.add('hidden');
    document.getElementById('airlock').querySelector('.item-icon').textContent = '🚪';
    log('log2', 'ACCESS GRANTED. Airlock seal released.');
  } else {
    log('log2', 'DENIED. Incorrect password.');
    document.getElementById('password-field').value = '';
  }
}

function clickAirlock() {
  if (!state.passwordSolved) {
    log('log2', 'Airlock sealed. The terminal might control it.');
    return;
  }
  log('log2', 'Airlock opens. Cold air rushes in from the pod bay.');
  setTimeout(() => goto('scene-pod'), 800);
}

// ROOM 3 -------------------------------------------------------

function selectWire(wire) {
  if (state.connections[wire]) return;
  state.selectedWire = wire;
  document.querySelectorAll('.wire-end.left').forEach(el => el.classList.remove('selected'));
  document.querySelector(`[data-wire="${wire}"]`).classList.add('selected');
  log('log3', `Wire ${wire} selected. Now click a port.`);
}

function connectPort(port) {
  if (!state.selectedWire) {
    log('log3', 'Select a wire first.');
    return;
  }
  // check port not already taken
  const taken = Object.values(state.connections).includes(port);
  if (taken) {
    log('log3', `Port ${port} is already connected.`);
    return;
  }

  const wire = state.selectedWire;
  state.connections[wire] = port;
  state.selectedWire = null;

  document.querySelector(`[data-wire="${wire}"]`).classList.remove('selected');
  document.querySelector(`[data-wire="${wire}"]`).classList.add('connected');
  document.querySelector(`[data-port="${port}"]`).classList.add('connected');

  log('log3', `Wire ${wire} → Port ${port} connected.`);

  // check win
  if (Object.keys(state.connections).length === 3) {
    checkWires();
  }
}

function checkWires() {
  const correct = Object.keys(CORRECT).every(w => state.connections[w] === CORRECT[w]);
  if (correct) {
    log('log3', 'ALL SYSTEMS ONLINE. Pod is ready for launch.');
    document.getElementById('launch-btn').classList.remove('hidden');
  } else {
    log('log3', 'POWER FAILURE. Wrong wiring. Resetting...');
    setTimeout(resetWires, 1200);
  }
}

function resetWires() {
  state.connections = {};
  state.selectedWire = null;
  document.querySelectorAll('.wire-end').forEach(el => {
    el.classList.remove('selected', 'connected');
  });
  log('log3', 'Try again. Remember the hint.');
}

function restartGame() {
  state.hasKeycard = false;
  state.lockerOpened = false;
  state.passwordSolved = false;
  state.airlockOpen = false;
  state.selectedWire = null;
  state.connections = {};
  state.wireSolved = false;

  document.getElementById('locker').classList.remove('used');
  document.getElementById('locker').querySelector('.item-icon').textContent = '🔒';
  document.getElementById('terminal-input').classList.add('hidden');
  document.getElementById('password-field').value = '';
  document.getElementById('airlock').querySelector('.item-icon').textContent = '🔐';
  document.getElementById('launch-btn').classList.add('hidden');
  resetWires();
  updateInventory();
  ['log', 'log2', 'log3'].forEach(id => { document.getElementById(id).innerHTML = ''; });

  goto('scene-intro');
}
