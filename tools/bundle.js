// usage: node tools/bundle.js <out-name> "<entry js>" part1 part2 ...
// Concatenates shared helpers + parts + an entry snippet into dist/<out-name>.js
// (comments and indentation stripped) ready to run through use_figma.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const [outName, entry, ...parts] = process.argv.slice(2);
const files = ['helpers', 'art', 'flow', ...parts].map((p) => path.join(root, 'src', p + '.js'));

const strip = (s) =>
  s
    .split('\n')
    .map((l) => l.replace(/^\s+/, ''))
    .filter((l) => l && !l.startsWith('//'))
    .join('\n');

const body = files.map((f) => strip(fs.readFileSync(f, 'utf8'))).join('\n') + '\n' + entry + '\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', outName + '.js');
fs.writeFileSync(out, body);
console.log(outName + ': ' + body.length + ' chars');
