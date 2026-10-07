// the lifeboat, built along +x (nose to the right). origin at the middle of the hull.
import * as THREE from 'three';
import { mat, glowMat, rbox, cyl, sphere, canvasTex } from './kit.js';

export function makePod({ ready = false, flame = false } = {}) {
  const g = new THREE.Group();
  const lampCol = ready ? 0x3dff9a : 0xff3b4e;

  // hull: lathe profile (radius vs. length), revolved around x
  const pts = [
    [-1.65, 0.0], [-1.62, 0.34], [-1.5, 0.5], [-1.1, 0.68], [-0.4, 0.78], [0.5, 0.78],
    [1.1, 0.68], [1.55, 0.46], [1.85, 0.2], [1.95, 0.0],
  ].map(([x, r]) => new THREE.Vector2(r, x));
  const hullGeo = new THREE.LatheGeometry(pts, 96);
  hullGeo.rotateZ(-Math.PI / 2);
  const hullTex = canvasTex(1024, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#dde6f2'); gr.addColorStop(1, '#9aaac4');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,55,85,0.5)'; ctx.lineWidth = 3;
    for (let x = 0; x < w; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  });
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.45, metalness: 0.5 }));
  hull.castShadow = true; hull.receiveShadow = true;
  g.add(hull);

  // colour rings
  for (const [x, col, r] of [[-0.9, 0xffb020, 0.745], [-0.7, 0xff3b4e, 0.765], [0.9, 0xffb020, 0.745]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 12, 96), mat(col, 0.45, 0.2));
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    g.add(ring);
  }
  // nozzle + thruster
  const nozzle = cyl(0.46, 0.3, 0.5, mat(0x1b2740, 0.4, 0.9), -1.85, 0, 0, g, 48);
  nozzle.rotation.z = Math.PI / 2;
  const nozzle2 = cyl(0.38, 0.22, 0.18, mat(0x05070d, 0.8, 0.3), -2.12, 0, 0, g, 48);
  nozzle2.rotation.z = Math.PI / 2;
  const fg = new THREE.Group();
  fg.visible = flame;
  g.add(fg);
  {
    const flameMat = (c0, c1) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { c0: { value: new THREE.Color(c0) }, c1: { value: new THREE.Color(c1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform vec3 c0; uniform vec3 c1; void main(){ float t = vUv.y; vec3 c = mix(c0, c1, t); float a = pow(1.0 - t, 1.4); gl_FragColor = vec4(c * 1.6, a); }',
    });
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.36, 3.2, 48, 12, true), flameMat(0xfff0c8, 0xff5a10));
    fl.rotation.z = Math.PI / 2;
    fl.position.x = -3.7;
    fg.add(fl);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.18, 2.0, 40, 12, true), flameMat(0xffffff, 0xffc060));
    core.rotation.z = Math.PI / 2;
    core.position.x = -3.1;
    fg.add(core);
  }
  // front window
  const win = new THREE.Mesh(new THREE.SphereGeometry(0.34, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x06101c, emissive: ready ? 0x2aff99 : 0x27d3ff, emissiveIntensity: ready ? 1.3 : 0.55, roughness: 0.1, metalness: 0.3 }));
  win.rotation.z = -Math.PI / 2 + 0.55;
  win.position.set(1.25, 0.4, 0.15);
  win.scale.set(1, 1, 1);
  const winMat = win.material;
  g.add(win);
  const winRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 14, 48), mat(0x6f86ad, 0.3, 0.95));
  winRing.position.set(1.25, 0.4, 0.15);
  winRing.lookAt(1.25 + 0.5, 0.4 + 0.8, 0.15 + 0.15);
  g.add(winRing);

  // hatch (faces +z, toward the camera)
  const hatch = new THREE.Group();
  hatch.position.set(-0.35, -0.02, 0.77);
  hatch.rotation.x = -0.02;
  g.add(hatch);
  rbox(0.8, 1.05, 0.06, mat(0xdde6f2, 0.3, 0.8), 0, 0, 0, hatch, 0.1);
  rbox(0.66, 0.9, 0.05, mat(0x243350, 0.4, 0.8), 0, 0, 0.03, hatch, 0.09);
  rbox(0.05, 0.3, 0.05, mat(0xc3d4e6, 0.25, 1), 0.22, 0, 0.07, hatch, 0.02);
  const lampM = glowMat(lampCol, 3.5);
  sphere(0.045, lampM, -0.18, 0.34, 0.07, hatch, 16);
  const hl = new THREE.PointLight(lampCol, ready ? 3 : 2.2, 3, 2);
  hl.position.set(-0.35, 0.34, 1.2);
  g.add(hl);
  g.userData.hatch = hatch;
  g.userData.flame = fg;
  g.userData.setReady = (r) => {
    const c = r ? 0x3dff9a : 0xff3b4e;
    lampM.color.setHex(c);
    lampM.emissive.setHex(c);
    hl.color.setHex(c);
    hl.intensity = r ? 3 : 2.2;
    winMat.emissive.setHex(r ? 0x2aff99 : 0x27d3ff);
    winMat.emissiveIntensity = r ? 1.3 : 0.55;
  };
  g.userData.update = (t) => {
    if (!fg.visible) return;
    fg.scale.set(1 + 0.12 * Math.sin(t * 38) + 0.07 * Math.sin(t * 23), 1 + 0.06 * Math.sin(t * 31), 1);
  };
  return g;
}
