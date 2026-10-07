// jumps straight to a powered pod bay and records the launch sequence frames. usage: node tools/debug-launch.js shotDir
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('../render3d/node_modules/puppeteer-core');
const root = path.join(__dirname, '..');
const shots = path.resolve(process.argv[2] || 'shots');
fs.mkdirSync(shots, { recursive: true });
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(root, u.endsWith('/') ? u + 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1440,900'], defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
  await page.goto('http://127.0.0.1:' + server.address().port + '/site/index.html');
  await page.waitForFunction('!document.getElementById("start").disabled', { timeout: 120000 });
  await page.evaluate(async () => {
    const { game, ui, engine } = window.__omega;
    Object.assign(game.S, { hasCard: true, locker: 'empty', pinOk: true, airlockOpen: true, powered: true, running: true });
    document.getElementById('title').classList.add('gone');
    ui.showHud(true);
    await game.enterRoom('pod');
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(shots, 'L0_pod.png') });
  if (process.argv[3] === 'space') {
    await page.evaluate(async () => { const { game, engine } = window.__omega; await game.enterRoom('space'); const api = engine.api; api.pod.visible = true; api.pod.scale.setScalar(1.0); api.pod.rotation.set(0.04, -0.35, 0.06); api.pod.position.set(-1.5, 3.1, 5); });
  } else await page.evaluate(() => { window.__omega.act('launchbtn'); });
  for (let i = 1; i <= 8; i++) {
    await sleep(1000);
    const info = await page.evaluate(() => { const c = window.__omega.engine.camera; const pd = window.__omega.engine.api && window.__omega.engine.api.pod; return JSON.stringify({ p: c.position.toArray().map((v) => +v.toFixed(2)), room: window.__omega.game.S.room, pod: pd ? { v: pd.visible, pos: pd.position.toArray().map((v) => +v.toFixed(1)), s: +pd.scale.x.toFixed(2) } : null }); });
    console.log('t=' + i, info);
    const url = await page.evaluate(() => { const e = window.__omega.engine; e.composer.render(0); return e.canvas.toDataURL('image/png'); });
    fs.writeFileSync(path.join(shots, 'C' + i + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
