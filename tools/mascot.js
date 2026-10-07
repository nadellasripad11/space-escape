// "oxy": the face-only mascot. one generator -> svg files + the data modules used by the site and the figma plugin.
// usage: node tools/mascot.js           (writes assets/mascot/*.svg, site/mascot-data.js, src/mascot-data.js)
//        node tools/mascot.js preview <png>   (renders a contact sheet of every expression)
const fs = require('fs');
const path = require('path');

const INK = '#0f2147';
const EXPRS = ['idle', 'happy', 'worried', 'dizzy'];

function defs(id) {
  return `<defs>
    <radialGradient id="${id}face" cx="0.38" cy="0.28" r="0.85"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#e3f3ff"/><stop offset="1" stop-color="#8ecbf6"/></radialGradient>
    <radialGradient id="${id}glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0.45" stop-color="#27d3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#27d3ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}eye" cx="0.5" cy="0.78" r="0.7"><stop offset="0" stop-color="#5a86ff"/><stop offset="0.55" stop-color="#1f3a85"/><stop offset="1" stop-color="${INK}"/></radialGradient>
    <radialGradient id="${id}cheek" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff6f9c" stop-opacity="0.9"/><stop offset="1" stop-color="#ff6f9c" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}orb" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#fff6c2"/><stop offset="0.6" stop-color="#ffd23b"/><stop offset="1" stop-color="#ff9f1a"/></radialGradient>
    <linearGradient id="${id}ear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9f1a"/></linearGradient>
  </defs>`;
}

function eyes(expr, id) {
  const dot = (cx, cy) => `
      <ellipse cx="${cx}" cy="${cy}" rx="16" ry="20" fill="url(#${id}eye)"/>
      <circle cx="${cx - 6}" cy="${cy - 8}" r="7" fill="#fff"/>
      <circle cx="${cx + 7}" cy="${cy + 8}" r="3.4" fill="#fff" fill-opacity="0.95"/>
      <circle cx="${cx + 8}" cy="${cy - 10}" r="1.8" fill="#fff" fill-opacity="0.8"/>`;
  if (expr === 'happy') {
    return `<g class="eyes" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round">
      <path d="M 53 110 Q 69 86 85 110"/><path d="M 115 110 Q 131 86 147 110"/></g>`;
  }
  if (expr === 'dizzy') {
    const spiral = (cx, cy) => `<path d="M ${cx} ${cy} m -2 0 a 3 3 0 1 1 6 0 a 6.5 6.5 0 1 1 -13 0 a 10 10 0 1 1 20 0 a 13.5 13.5 0 1 1 -27 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return `<g class="eyes">${spiral(70, 104)}${spiral(130, 104)}</g>`;
  }
  const brows = expr === 'worried'
    ? `<path d="M 50 84 L 86 74" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M 114 74 L 150 84" stroke="${INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`
    : '';
  return `<g class="eyes">${dot(70, 104)}${dot(130, 104)}</g>${brows}`;
}

function mouth(expr, id) {
  if (expr === 'happy') {
    return `<path d="M 84 122 Q 100 156 116 122 Z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M 92 139 Q 100 130 108 139 Q 100 150 92 139 Z" fill="#ff7a9a"/>`;
  }
  if (expr === 'worried') return `<path d="M 86 136 Q 93 128 100 135 Q 107 142 114 134" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
  if (expr === 'dizzy') return `<path d="M 82 134 Q 91 124 100 134 Q 109 144 118 134" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
  return `<path d="M 89 128 Q 94.5 138 100 128 Q 105.5 138 111 128" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function extras(expr) {
  if (expr === 'happy') {
    const star = (x, y, s) => `<path d="M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z" fill="#fff6c2" stroke="#ffd23b" stroke-width="1.2"/>`;
    return star(30, 60, 9) + star(172, 52, 6) + star(176, 150, 5);
  }
  if (expr === 'worried') return `<path d="M 164 62 Q 172 78 164 86 Q 156 78 164 62 Z" fill="#9fe2ff" stroke="#3a8fd0" stroke-width="2"/>`;
  if (expr === 'dizzy') {
    const star = (x, y, s) => `<path d="M ${x} ${y - s} L ${x + s * 0.3} ${y - s * 0.3} L ${x + s} ${y} L ${x + s * 0.3} ${y + s * 0.3} L ${x} ${y + s} L ${x - s * 0.3} ${y + s * 0.3} L ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.3} Z" fill="#ffd23b"/>`;
    return star(52, 40, 7) + star(100, 30, 5) + star(150, 40, 7);
  }
  return '';
}

function svg(expr, o) {
  o = o || {};
  const id = 'o' + expr[0];
  const style = o.animated
    ? `<style>.mascot-bob{animation:bob 3.2s ease-in-out infinite;transform-origin:100px 190px}.eyes{transform-origin:100px 104px;animation:blink 4.6s infinite}.orb{animation:orb 1.6s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-4px)}}@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}@keyframes orb{50%{opacity:.55}}</style>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="oxy the mascot (${expr})">${style}${defs(id)}
  <g class="mascot-bob">
    <circle cx="100" cy="108" r="98" fill="url(#${id}glow)"/>
    <ellipse cx="100" cy="188" rx="46" ry="6" fill="#000" fill-opacity="0.22"/>
    <rect x="96.5" y="14" width="7" height="22" rx="3.5" fill="#5b86c4"/>
    <circle class="orb" cx="100" cy="12" r="9.5" fill="url(#${id}orb)"/>
    <circle cx="97" cy="9" r="3" fill="#fff" fill-opacity="0.9"/>
    <circle cx="17" cy="112" r="12" fill="url(#${id}ear)" stroke="#c27d00" stroke-width="2.5"/><circle cx="17" cy="112" r="4.5" fill="#fff4cf" fill-opacity="0.8"/>
    <circle cx="183" cy="112" r="12" fill="url(#${id}ear)" stroke="#c27d00" stroke-width="2.5"/><circle cx="183" cy="112" r="4.5" fill="#fff4cf" fill-opacity="0.8"/>
    <ellipse cx="100" cy="108" rx="84" ry="76" fill="url(#${id}face)" stroke="#2b6cb0" stroke-width="4.5"/>
    <ellipse cx="68" cy="60" rx="30" ry="11" transform="rotate(-18 68 60)" fill="#fff" fill-opacity="0.6"/>
    ${eyes(expr, id)}
    <ellipse cx="42" cy="128" rx="16" ry="10" fill="url(#${id}cheek)"/><ellipse cx="158" cy="128" rx="16" ry="10" fill="url(#${id}cheek)"/>
    ${mouth(expr, id)}
    ${extras(expr)}
  </g>
</svg>`;
}

module.exports = { svg, EXPRS };

if (require.main === module) {
  const root = path.join(__dirname, '..');
  if (process.argv[2] === 'preview') {
    const { Resvg } = require('./node_modules/@resvg/resvg-js');
    const cell = 300;
    const body = EXPRS.map((e, i) => `<svg x="${i * cell}" y="0" width="${cell}" height="${cell}" viewBox="0 0 200 200">${svg(e).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`).join('');
    const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell * EXPRS.length}" height="${cell}"><rect width="100%" height="100%" fill="#0a1220"/>${body}</svg>`;
    fs.writeFileSync(process.argv[3], new Resvg(sheet, { fitTo: { mode: 'width', value: cell * EXPRS.length } }).render().asPng());
    console.log('preview ->', process.argv[3]);
  } else {
    fs.mkdirSync(path.join(root, 'assets', 'mascot'), { recursive: true });
    const data = {};
    for (const e of EXPRS) {
      fs.writeFileSync(path.join(root, 'assets', 'mascot', 'oxy-' + e + '.svg'), svg(e, { animated: true }));
      data[e] = svg(e);
    }
    fs.writeFileSync(path.join(root, 'site', 'mascot-data.js'), '// generated by tools/mascot.js\nexport const MASCOT = ' + JSON.stringify(data) + ';\n');
    fs.writeFileSync(path.join(root, 'src', 'mascot-data.js'), '// generated by tools/mascot.js\nconst MASCOT = ' + JSON.stringify(data) + ';\n');
    console.log('mascot written:', EXPRS.join(', '));
  }
}
