// ---- 3d render images + glass ui helpers ---------------------------------------
const IMG = {};

function imagePaint(name, mode) {
  if (!ASSETS[name]) throw new Error('missing asset: ' + name);
  if (!IMG[name]) IMG[name] = figma.createImage(figma.base64Decode(ASSETS[name]));
  return { type: 'IMAGE', scaleMode: mode || 'FILL', imageHash: IMG[name].hash };
}

// the full-frame render behind a screen. named "bg" in every frame so smart animate can zoom it
function bgImage(parent, name) {
  return rect(parent, 0, 0, 1440, 900, { fill: imagePaint(name), name: 'bg' });
}

// the same render, pushed in on a region (the camera-move target) and optionally blurred
function zoomBg(parent, name, region, zoom, blur) {
  const cx = region.x + region.w / 2;
  const cy = region.y + region.h / 2;
  const n = rect(parent, 720 - cx * zoom, 450 - cy * zoom, 1440 * zoom, 900 * zoom, { fill: imagePaint(name), name: 'bg' });
  if (blur) n.effects = [{ type: 'LAYER_BLUR', radius: blur, visible: true }];
  return n;
}

function dim(parent, alpha, color) {
  return rect(parent, 0, 0, 1440, 900, { fill: color || '#02050b', op: alpha, name: 'dim' });
}

// frosted panel: translucent fill, hairline border, background blur
function glass(parent, x, y, w, h, o) {
  o = o || {};
  const fx = [{ type: 'BACKGROUND_BLUR', radius: o.blur || 18, visible: true }];
  if (o.glow) fx.push(glow(o.glow, o.glowR || 24, o.glowA || 0.3));
  if (o.shadow !== false) fx.push(shadow(10, 28, 0.45));
  const n = rect(parent, x, y, w, h, {
    fill: o.fill || '#07101e',
    op: o.op === undefined ? 0.62 : o.op,
    r: o.r === undefined ? 16 : o.r,
    fx,
    name: o.name || 'glass',
  });
  n.strokes = [{ type: 'SOLID', color: rgb(o.stroke || '#9fc4ff'), opacity: o.strokeOp === undefined ? 0.28 : o.strokeOp }];
  n.strokeWeight = o.sw || 1.2;
  n.strokeAlign = 'INSIDE';
  return n;
}

// a hotspot placed over a 3d object's screen region
function hotRegion(parent, region, name, pad, minSize) {
  pad = pad === undefined ? 14 : pad;
  minSize = minSize || 64;
  let x = region.x - pad;
  let y = region.y - pad;
  let w = region.w + pad * 2;
  let h = region.h + pad * 2;
  if (w < minSize) { x -= (minSize - w) / 2; w = minSize; }
  if (h < minSize) { y -= (minSize - h) / 2; h = minSize; }
  x = Math.max(0, x);
  y = Math.max(0, y);
  w = Math.min(w, 1440 - x);
  h = Math.min(h, 900 - y);
  return hotspot(parent, x, y, w, h, name);
}
