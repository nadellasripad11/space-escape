// Builds dist/prelude.txt (helpers + shared art, comments stripped) and
// dist/exports.txt (the destructuring line a build call uses to reach them).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const parts = ['helpers', 'art', 'flow', 'ui'];
const strip = (s) =>
  s
    .split('\n')
    .map((l) => l.replace(/^\s+/, ''))
    .filter((l) => l && !l.startsWith('//'))
    .join('\n');

const raw = parts.map((p) => fs.readFileSync(path.join(root, 'src', p + '.js'), 'utf8')).join('\n');
const names = [];
for (const m of raw.matchAll(/^(?:async )?function (\w+)|^const (\w+) =/gm)) names.push(m[1] || m[2]);

const prelude = strip(raw) + '\nreturn {' + names.join(',') + '};';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'prelude.txt'), prelude);
fs.writeFileSync(path.join(root, 'dist', 'exports.txt'), 'const {' + names.join(',') + '} = new Function(prelude)();');
console.log('prelude', prelude.length, 'chars,', names.length, 'exports');
console.log(/`|\$\{/.test(prelude) ? 'WARNING: backtick or ${ in prelude' : 'raw-string safe');
