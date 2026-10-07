// renders every final asset into render3d/out (jpg + region json). usage: node render3d/render-all.js [name ...]
const { execFileSync } = require('child_process');
const path = require('path');
const jobs = [
  ['quarters', 'closed'], ['quarters', 'open'], ['quarters', 'empty'],
  ['control', 'sealed'], ['control', 'open'],
  ['pod', 'dead'], ['pod', 'ready'],
  ['title', ''], ['space', ''], ['podsprite', '', '--png'],
];
const only = process.argv.slice(2);
for (const [scene, state, ...extra] of jobs) {
  const key = scene + (state ? '_' + state : '');
  if (only.length && !only.includes(key) && !only.includes(scene)) continue;
  const args = [path.join(__dirname, 'render.js'), scene];
  if (state) args.push(state);
  args.push(...extra);
  process.stdout.write(execFileSync(process.execPath, args, { encoding: 'utf8' }).split('\n').filter((l) => l.startsWith('rendered')).join('\n') + '\n');
}
