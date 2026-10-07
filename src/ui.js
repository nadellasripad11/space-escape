// ---- shared ui pieces ---------------------------------------------------------

function closeBtn(f, x, y, to, o) {
  glass(f, x, y, 46, 46, { r: 23, op: 0.6, blur: 14, shadow: false, name: 'close' });
  text(f, x, y, '✕', { font: 'bold', size: 18, fill: C.white, w: 46, align: 'CENTER', lh: 46, name: 'close x' });
  go(hotspot(f, x - 6, y - 6, 58, 58, 'close'), to, o || { d: 0.18 });
}

function pill(f, x, y, w, h, label, col, filled) {
  rect(f, x, y, w, h, {
    fill: filled ? col : '#050a14',
    op: filled ? 1 : 0.55,
    stroke: filled ? '#ffffff' : col,
    sw: 2,
    r: h / 2,
    fx: [glow(col, 26, filled ? 0.6 : 0.3), shadow(8, 18, 0.5)],
    name: 'button',
  });
  if (filled) rect(f, x + 3, y + 3, w - 6, h / 2 - 3, { fill: linear([[0, '#ffffff', 0.35], [1, '#ffffff', 0]], 90), r: h / 2, name: 'button sheen' });
  text(f, x, y, label, {
    font: 'head',
    size: Math.round(h * 0.3),
    fill: filled ? '#02121a' : col,
    ls: 4,
    w,
    align: 'CENTER',
    lh: h,
    name: 'button label',
  });
}

// camera push-in used for every close-up
const PUSH = { t: 'SMART_ANIMATE', d: 0.55, ease: 'EASE_IN_AND_OUT' };
