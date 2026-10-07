// copies just the three.js files the live site needs into site/vendor/three (so github pages needs no cdn)
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'render3d', 'node_modules', 'three');
const dst = path.join(__dirname, '..', 'site', 'vendor', 'three');
const entries = [
  'build/three.module.js',
  'examples/jsm/geometries/RoundedBoxGeometry.js',
  'examples/jsm/postprocessing/EffectComposer.js',
  'examples/jsm/postprocessing/RenderPass.js',
  'examples/jsm/postprocessing/UnrealBloomPass.js',
  'examples/jsm/postprocessing/ShaderPass.js',
  'examples/jsm/postprocessing/OutputPass.js',
  'examples/jsm/postprocessing/OutlinePass.js',
];

const seen = new Set();
function copy(rel) {
  if (seen.has(rel)) return;
  seen.add(rel);
  const from = path.join(src, rel);
  if (!fs.existsSync(from)) throw new Error('missing ' + rel);
  const to = path.join(dst, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  const code = fs.readFileSync(from, 'utf8');
  for (const m of code.matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)) {
    copy(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
  }
}
entries.forEach(copy);
const size = [...seen].reduce((a, r) => a + fs.statSync(path.join(dst, r)).size, 0);
console.log('vendored', seen.size, 'files,', (size / 1e6).toFixed(2), 'MB');
