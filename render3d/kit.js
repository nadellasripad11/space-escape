import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };

// ---- regions: screen-space boxes of named objects, in 1440x900 ----------------
const reg = {};
export const live = { on: false };
export function clearRegistry() { for (const k of Object.keys(reg)) delete reg[k]; }
export function getRegistry() { return reg; }

// ---- tweens (driven by tick(dtMs) in the live site) -----------------------------------
export const ease = {
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t,
  linear: (t) => t,
};
const tweens = [];
export function tweenValue(from, to, ms, onUpdate, easing) {
  return new Promise((resolve) => {
    tweens.push({ from, to, ms, t: 0, onUpdate, easing: easing || ease.inOut, resolve });
  });
}
export function tick(dtMs) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i];
    w.t += dtMs;
    const k = Math.min(1, w.t / w.ms);
    w.onUpdate(w.from + (w.to - w.from) * w.easing(k));
    if (k >= 1) { tweens.splice(i, 1); w.resolve(); }
  }
}
export function clearTweens() { tweens.length = 0; }

export function register(name, obj) {
  reg[name] = obj;
  return obj;
}
export function projectRegions(camera, outW, outH) {
  camera.updateMatrixWorld(true);
  const out = {};
  for (const [name, obj] of Object.entries(reg)) {
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const v = new THREE.Vector3(x, y, z).project(camera);
      const px = (v.x * 0.5 + 0.5) * outW;
      const py = (1 - (v.y * 0.5 + 0.5)) * outH;
      minx = Math.min(minx, px); maxx = Math.max(maxx, px);
      miny = Math.min(miny, py); maxy = Math.max(maxy, py);
    }
    out[name] = { x: Math.round(minx), y: Math.round(miny), w: Math.round(maxx - minx), h: Math.round(maxy - miny) };
  }
  return out;
}

// ---- seeded random --------------------------------------------------------------
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- materials + meshes -----------------------------------------------------------
export function mat(color, rough = 0.5, metal = 0, extra = {}) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra));
}
export function glowMat(color, intensity = 2, base = null) {
  return new THREE.MeshStandardMaterial({ color: base || color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
}
export function place(mesh, x = 0, y = 0, z = 0, parent = null) {
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (parent) parent.add(mesh);
  return mesh;
}
export function rbox(w, h, d, material, x, y, z, parent, r = 0.02) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));
  return place(new THREE.Mesh(g, material), x, y, z, parent);
}
export function cyl(rt, rb, h, material, x, y, z, parent, seg = 48) {
  return place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material), x, y, z, parent);
}
export function sphere(r, material, x, y, z, parent, seg = 48) {
  return place(new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), material), x, y, z, parent);
}
export function plane(w, h, material, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.receiveShadow = true;
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

// ---- canvas textures ----------------------------------------------------------------
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 16;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  return t;
}

// brushed / paneled metal: returns { map, bump, rough }
export function panelMaps(opts = {}) {
  const { base = '#26334d', seam = '#05080f', cells = 4, repeat = [2, 2], seed = 3, grime = 0.35, rivets = true } = opts;
  const S = 1024;
  const r = rng(seed);
  const paint = (ctx, mode) => {
    const isColor = mode === 'color';
    ctx.fillStyle = isColor ? base : '#808080';
    ctx.fillRect(0, 0, S, S);
    // soft per-panel tone shifts
    const n = cells;
    const cs = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (r() - 0.5) * 0.18;
      ctx.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + -v + ')';
      ctx.fillRect(i * cs, j * cs, cs, cs);
    }
    // brushed streaks
    for (let k = 0; k < 900; k++) {
      ctx.strokeStyle = 'rgba(' + (r() < 0.5 ? '255,255,255' : '0,0,0') + ',' + r() * 0.05 + ')';
      ctx.lineWidth = 1;
      const y = r() * S;
      const x = r() * S;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40 + r() * 260, y);
      ctx.stroke();
    }
    // grime blotches
    for (let k = 0; k < 40; k++) {
      const g = ctx.createRadialGradient(r() * S, r() * S, 0, r() * S, r() * S, 60 + r() * 160);
      const x = r() * S, y = r() * S, rad = 60 + r() * 160;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, 'rgba(0,0,0,' + grime * 0.25 + ')');
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gg;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // seams
    ctx.strokeStyle = isColor ? seam : '#000';
    ctx.lineWidth = isColor ? 5 : 9;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cs); ctx.lineTo(S, i * cs); ctx.stroke();
    }
    // bevel highlight next to seams
    ctx.strokeStyle = isColor ? 'rgba(255,255,255,0.08)' : '#d0d0d0';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * cs + 5, 0); ctx.lineTo(i * cs + 5, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cs + 5); ctx.lineTo(S, i * cs + 5); ctx.stroke();
    }
    if (rivets) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        for (const [dx, dy] of [[18, 18], [cs - 18, 18], [18, cs - 18], [cs - 18, cs - 18]]) {
          ctx.fillStyle = isColor ? 'rgba(255,255,255,0.16)' : '#f0f0f0';
          ctx.beginPath(); ctx.arc(i * cs + dx, j * cs + dy, 4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };
  const map = canvasTex(S, S, (c) => paint(c, 'color'), { repeat });
  const bump = canvasTex(S, S, (c) => paint(c, 'bump'), { repeat, linear: true });
  return { map, bump };
}

export function noiseRough(seed = 9, repeat = [2, 2]) {
  const r = rng(seed);
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 2200; k++) {
      ctx.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + r() * 0.18 + ')';
      const s = 2 + r() * 40;
      ctx.fillRect(r() * w, r() * h, s, s * (0.2 + r()));
    }
  }, { repeat, linear: true });
}

// ---- space ------------------------------------------------------------------------------
export function starfield(count = 1500, radius = 80, seed = 5) {
  const r = rng(seed);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    const rad = radius * (0.85 + r() * 0.15);
    pos[i * 3] = rad * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = rad * Math.cos(ph);
    pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
    const tint = r();
    const c = tint < 0.15 ? [0.6, 0.85, 1] : tint < 0.25 ? [1, 0.85, 0.7] : [1, 1, 1];
    const b = 0.4 + r() * 0.6;
    col[i * 3] = c[0] * b; col[i * 3 + 1] = c[1] * b; col[i * 3 + 2] = c[2] * b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  return new THREE.Points(g, m);
}

export function planetTexture(seed = 7) {
  const r = rng(seed);
  return canvasTex(2048, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#173e82');
    g.addColorStop(0.5, '#1d5fb8');
    g.addColorStop(1, '#0d2a5e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const y = r() * h;
      const th = 8 + r() * 46;
      ctx.fillStyle = 'rgba(' + (r() < 0.5 ? '170,215,255' : '10,30,80') + ',' + (0.05 + r() * 0.16) + ')';
      ctx.beginPath();
      ctx.ellipse(r() * w, y, 160 + r() * 500, th, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + r() * 0.08 + ')';
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 20 + r() * 120, 4 + r() * 20, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function planet(radius, seed = 7) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshStandardMaterial({ map: planetTexture(seed), roughness: 0.85, metalness: 0, emissive: 0x0a1a3a, emissiveIntensity: 0.6 })
  );
  g.add(body);
  const atm = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.045, 96, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { c: { value: new THREE.Color(0x3fb4ff) } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; uniform vec3 c; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(c, f*0.9); }',
    })
  );
  g.add(atm);
  return g;
}

// ---- post: grade --------------------------------------------------------------------------
export function gradeShader(o = {}) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      vig: { value: o.vignette === undefined ? 0.5 : o.vignette },
      grain: { value: o.grain === undefined ? 0.035 : o.grain },
      ca: { value: o.aberration === undefined ? 0.0016 : o.aberration },
      tint: { value: new THREE.Vector3(...(o.tint || [1.0, 1.0, 1.0])) },
      lift: { value: new THREE.Vector3(...(o.lift || [0.0, 0.0, 0.0])) },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform sampler2D tDiffuse; uniform float vig; uniform float grain; uniform float ca; uniform vec3 tint; uniform vec3 lift;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = vUv - 0.5;
        float r2 = dot(d,d);
        vec2 off = d * ca * (1.0 + r2*4.0);
        float cr = texture2D(tDiffuse, vUv + off).r;
        float cg = texture2D(tDiffuse, vUv).g;
        float cb = texture2D(tDiffuse, vUv - off).b;
        vec3 c = vec3(cr, cg, cb) * tint + lift;
        float v = smoothstep(0.95, 0.15, r2*2.2);
        c *= mix(1.0 - vig, 1.0, v);
        c += (h(vUv * 1731.0) - 0.5) * grain;
        gl_FragColor = vec4(c, 1.0);
      }`,
  };
}
