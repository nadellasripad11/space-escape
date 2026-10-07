// ---- title, quarters, control room ------------------------------------------

function closeBtn(f, x, y, to) {
  rect(f, x, y, 44, 44, { fill: '#0b1424', stroke: C.line, sw: 1.5, r: 22, name: 'close' });
  text(f, x, y, '✕', { font: 'bold', size: 18, fill: C.white, w: 44, align: 'CENTER', lh: 44, name: 'close x' });
  go(hotspot(f, x - 6, y - 6, 56, 56, 'close'), to, { d: 0.18 });
}

function pill(f, x, y, w, h, label, col, filled) {
  rect(f, x, y, w, h, {
    fill: filled ? col : '#050a14',
    stroke: col,
    sw: 2,
    r: h / 2,
    fx: [glow(col, 24, filled ? 0.55 : 0.3)],
    name: 'button',
  });
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

