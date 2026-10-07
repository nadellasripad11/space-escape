// plays the live site in headless chrome: solution path + a few wrong answers. usage: node tools/test-site.js [shotDir]
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('../render3d/node_modules/puppeteer-core');

const root = path.join(__dirname, '..');
const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(root, u.endsWith('/') ? u + 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) fails++; };

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', '--window-size=1440,900', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(process.argv[3] || 'http://127.0.0.1:' + port + '/site/index.html');
  const shot = async (n) => { if (shots) await page.screenshot({ path: path.join(shots, n + '.png') }); };
  const S = () => page.evaluate('JSON.parse(JSON.stringify(window.__omega.game.S))');
  const act = (n) => page.evaluate((n) => { window.__omega.act(n); }, n);

  await page.waitForFunction('!document.getElementById("start").disabled', { timeout: 120000 });
  check('title scene loads', true);
  await sleep(1200);
  await shot('01_title');

  await page.click('#start');
  await sleep(3800);
  let s = await S();
  check('wake up -> quarters', s.room === 'quarters' && s.running);
  await shot('02_quarters');

  await act('door');
  await sleep(500);
  check('door locked without keycard', (await S()).room === 'quarters');

  await act('locker');
  await sleep(1600);
  s = await S();
  check('locker opens', s.locker === 'open');
  await shot('03_locker_open');
  await act('keycard');
  await sleep(1500);
  s = await S();
  check('keycard taken', s.hasCard && s.locker === 'empty');
  check('inventory shows the card', await page.evaluate('document.querySelector("#slot0 .card-ico") !== null'));

  await act('poster');
  await sleep(1500);
  check('poster close-up opens', await page.evaluate('document.querySelector(".poster") !== null'));
  await shot('04_poster');
  await page.keyboard.press('Escape');
  await sleep(1200);
  check('esc closes the modal', await page.evaluate('document.querySelector(".poster") === null'));

  await act('door');
  await sleep(3500);
  s = await S();
  check('door -> control room', s.room === 'control');
  await shot('05_control');
  await page.click('#hint');
  await sleep(1300);
  check('hint card shows oxy', await page.evaluate('document.querySelector(".hintcard .mascot") !== null'));
  await shot('05b_hint');
  await page.keyboard.press('Escape');
  await sleep(700);

  await act('airlock');
  await sleep(400);
  check('airlock sealed before the pin', !(await S()).airlockOpen);

  await act('terminal');
  await sleep(1500);
  check('keypad opens', await page.evaluate('document.querySelector(".keypad") !== null'));
  const press = async (k) => { await page.click('.key[data-k="' + k + '"]'); await sleep(80); };
  await press('3'); await press('4');
  await sleep(1500);
  check('wrong pin does not unlock', !(await S()).pinOk && await page.evaluate('document.querySelector(".keypad") !== null'));
  await shot('06_keypad');
  await press('5'); await press('6');
  await sleep(2200);
  s = await S();
  check('pin 56 unlocks', s.pinOk);
  await sleep(2600);
  s = await S();
  check('airlock opens after the pin', s.airlockOpen);
  await shot('07_airlock_open');

  await act('airlock');
  await sleep(3600);
  s = await S();
  check('airlock -> pod bay', s.room === 'pod');
  await shot('08_pod');

  await act('hatch');
  await sleep(500);
  check('hatch sealed without power', (await S()).room === 'pod' && !(await S()).launching);

  await act('panel');
  await sleep(1600);
  check('wiring panel opens', await page.evaluate('document.querySelector(".wiring") !== null'));
  await shot('09_wiring');
  await page.click('#portg0');
  await sleep(1300);
  check('wrong wire resets', await page.evaluate('document.querySelectorAll("#runs path").length') === 0);
  for (const p of [1, 2, 0]) { await page.click('#portg' + p); await sleep(450); }
  await sleep(1800);
  s = await S();
  check('wiring complete -> pod powered', s.powered);
  await shot('10_pod_ready');

  await act('launchbtn');
  await sleep(2500);
  await shot('11_countdown');
  await sleep(9000);
  await shot('12_space');
  await sleep(2500);
  check('launch -> win card', await page.evaluate('document.querySelector(".endcard #again") !== null'));
  await shot('13_win');

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('url:', page.url());
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await browser.close();
  server.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
