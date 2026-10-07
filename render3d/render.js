// usage: node render3d/render.js <scene> [state] [--scale 1.5] [--png] [--out dir]
// renders scenes/<scene>.js in headless chrome (webgl) -> out/<scene>[_state].jpg + .json (screen regions)
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const scale = flag('--scale', '1.5');
const outDir = path.resolve(flag('--out', path.join(__dirname, 'out')));
const asPng = args.includes('--png') ? (args.splice(args.indexOf('--png'), 1), true) : false;
const [scene, state = ''] = args;
if (!scene) { console.error('usage: render.js <scene> [state]'); process.exit(1); }

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const root = __dirname;
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(root, u === '/' ? 'index.html' : u);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const url = 'http://127.0.0.1:' + port + '/index.html?scene=' + scene + '&state=' + state + '&scale=' + scale;
  const t0 = Date.now();
  await page.goto(url);
  await page.waitForFunction('window.__ready || window.__error', { timeout: 240000 });
  const err = await page.evaluate('window.__error');
  if (err) { console.error('render failed:\n' + err); await browser.close(); server.close(); process.exit(1); }
  const dataUrl = await page.evaluate(asPng ? "window.__png('image/png')" : "window.__png('image/jpeg', 0.86)");
  const regions = await page.evaluate('window.__regions');
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, scene + (state ? '_' + state : ''));
  fs.writeFileSync(base + (asPng ? '.png' : '.jpg'), Buffer.from(dataUrl.split(',')[1], 'base64'));
  fs.writeFileSync(base + '.json', JSON.stringify(regions, null, 1));
  console.log('rendered', path.basename(base), ((Date.now() - t0) / 1000).toFixed(1) + 's', fs.statSync(base + (asPng ? '.png' : '.jpg')).size, 'bytes');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
