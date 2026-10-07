// concatenates src/ into plugin/code.js (no bundler needed) and syntax-checks it
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const parts = ['helpers', 'art', 'flow', 'ui', 'rooms1a', 'rooms1b', 'rooms2', 'wire', 'plugin-main'];
const code = parts.map((p) => '// ---- ' + p + '.js\n' + fs.readFileSync(path.join(root, 'src', p + '.js'), 'utf8')).join('\n');
const out = path.join(root, 'plugin', 'code.js');
fs.writeFileSync(out, code);
execFileSync(process.execPath, ['--check', out]);
console.log('plugin/code.js', code.length, 'chars, syntax ok');
