// control room. state: sealed | open
export const exposure = 0.95;
export const bloom = { strength: 0.33, radius: 0.6, threshold: 0.93 };
export const grade = { vignette: 0.5, grain: 0.03, tint: [0.98, 1.02, 1.08], lift: [0.0, 0.004, 0.014] };

export async function build(state, kit) {
  const { THREE, mat, glowMat, rbox, cyl, sphere, plane, panelMaps, noiseRough, canvasTex, starfield, planet, register, rng } = kit;
  const open = state === 'open';
  const accent = open ? 0x3dff9a : 0x27d3ff;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x0a1220, 0.025);

  const cam = new THREE.PerspectiveCamera(56, 1.6, 0.1, 140);
  cam.position.set(0.15, 1.5, 3.75);
  cam.lookAt(0.0, 1.38, -2);

  // ---- shell --------------------------------------------------------------------------
  const wm = panelMaps({ base: '#2d3d5e', repeat: [0.5, 0.5], cells: 4, seed: 21 });
  const wall = mat(0xffffff, 0.5, 0.5, { map: wm.map, bumpMap: wm.bump, bumpScale: 2.2 });
  const shape = new THREE.Shape();
  shape.moveTo(-3.5, 0); shape.lineTo(3.5, 0); shape.lineTo(3.5, 3); shape.lineTo(-3.5, 3); shape.lineTo(-3.5, 0);
  const hole = new THREE.Path();
  hole.moveTo(-1.5, 1.4); hole.lineTo(1.5, 1.4); hole.lineTo(1.5, 2.75); hole.lineTo(-1.5, 2.75); hole.lineTo(-1.5, 1.4);
  shape.holes.push(hole);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(shape), wall);
  back.position.z = -2;
  back.receiveShadow = true;
  scene.add(back);

  const sideM = panelMaps({ base: '#2d3d5e', repeat: [3, 1.5], cells: 4, seed: 23 });
  const sideWall = mat(0xffffff, 0.5, 0.5, { map: sideM.map, bumpMap: sideM.bump, bumpScale: 2.2 });
  const left = plane(7.5, 3, sideWall, -3.5, 1.5, 1.75, scene); left.rotation.y = Math.PI / 2;
  const right = plane(7.5, 3, sideWall, 3.5, 1.5, 1.75, scene); right.rotation.y = -Math.PI / 2;
  const fm = panelMaps({ base: '#2b3753', repeat: [7, 7], cells: 4, seed: 28, grime: 0.55 });
  const floor = plane(7, 7.5, mat(0xffffff, 0.3, 0.65, { map: fm.map, bumpMap: fm.bump, bumpScale: 2.5, roughnessMap: noiseRough(5, [7, 7]) }), 0, 0, 1.75, scene);
  floor.rotation.x = -Math.PI / 2;
  const cm = panelMaps({ base: '#18223a', repeat: [4, 4], cells: 4, seed: 12 });
  const ceil = plane(7, 7.5, mat(0xffffff, 0.7, 0.3, { map: cm.map, bumpMap: cm.bump, bumpScale: 2 }), 0, 3, 1.75, scene);
  ceil.rotation.x = Math.PI / 2;

  const trim = mat(0x0b111e, 0.5, 0.7);
  rbox(7, 0.2, 0.12, trim, 0, 0.1, -1.94, scene, 0.02);
  rbox(7, 0.025, 0.02, glowMat(accent, 2.2), 0, 0.22, -1.9, scene, 0.005);
  rbox(7, 0.26, 0.2, trim, 0, 2.88, -1.88, scene, 0.02);
  for (const sx of [-1, 1]) rbox(0.1, 3, 0.1, trim, sx * 3.45, 1.5, -1.95, scene, 0.02);

  // ---- window + space --------------------------------------------------------------------
  const frameM = mat(0x16213a, 0.35, 0.85);
  rbox(3.3, 0.14, 0.22, frameM, 0, 2.78, -1.9, scene, 0.03);
  rbox(3.3, 0.14, 0.22, frameM, 0, 1.38, -1.9, scene, 0.03);
  rbox(0.14, 1.5, 0.22, frameM, -1.58, 2.08, -1.9, scene, 0.03);
  rbox(0.14, 1.5, 0.22, frameM, 1.58, 2.08, -1.9, scene, 0.03);
  rbox(0.07, 1.4, 0.12, frameM, 0, 2.08, -1.95, scene, 0.02);
  rbox(3.1, 0.06, 0.12, frameM, 0, 2.1, -1.95, scene, 0.02);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.35), new THREE.MeshPhysicalMaterial({ color: 0xaad4ff, transparent: true, opacity: 0.06, roughness: 0.02, metalness: 0, depthWrite: false }));
  glass.position.set(0, 2.08, -1.97);
  scene.add(glass);
  register('window', glass);

  const pl = planet(9, 11);
  pl.traverse((o) => { if (o.material && o.material.fog !== undefined) o.material.fog = false; });
  pl.position.set(3.2, -3.8, -17);
  pl.rotation.y = 0.6;
  scene.add(pl);
  const stars = starfield(1800, 70, 4);
  stars.position.set(0, 2, 0);
  stars.material.fog = false;
  scene.add(stars);
  const sun = new THREE.DirectionalLight(0xffeedd, 3.2);
  sun.position.set(-8, 7, -4);
  sun.target.position.set(3.2, -3.8, -17);
  scene.add(sun, sun.target);

  // ---- console + monitors ------------------------------------------------------------------
  const deskM = mat(0x1e2b49, 0.4, 0.8);
  rbox(4.7, 0.9, 0.95, deskM, 0, 0.45, -1.08, scene, 0.05);
  const top = rbox(4.7, 0.08, 0.78, mat(0x33466d, 0.35, 0.85), 0, 0.93, -1.14, scene, 0.03);
  top.rotation.x = 0.08;
  const r = rng(6);
  const ledCols = [0xffb020, 0x27d3ff, 0x12647a, 0x3dff9a, 0x1b2a44];
  for (let i = 0; i < 46; i++) {
    const c = ledCols[Math.floor(r() * ledCols.length)];
    const on = c !== 0x1b2a44;
    rbox(0.07, 0.025, 0.07, on ? glowMat(c, 1.6 + r()) : mat(c, 0.5, 0.2), -2.1 + (i % 23) * 0.18, 0.98, -0.95 - Math.floor(i / 23) * 0.14, scene, 0.008);
  }
  rbox(4.7, 0.05, 0.05, glowMat(accent, 2.0), 0, 0.12, -0.6, scene, 0.01);

  const termTex = canvasTex(640, 400, (ctx, w, h) => {
    ctx.fillStyle = '#031017'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 400);
    g.addColorStop(0, open ? 'rgba(61,255,154,0.22)' : 'rgba(39,211,255,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = open ? '#3dff9a' : '#27d3ff';
    ctx.font = '600 38px Consolas, monospace';
    const lines = open ? ['> AIRLOCK 03', '> SEAL RELEASED', '> PIN OK', '> _'] : ['> AIRLOCK 03', '> STATUS: SEALED', '> PIN REQUIRED', '> _'];
    lines.forEach((l, i) => ctx.fillText(l, 36, 80 + i * 74));
    for (let y = 0; y < h; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y, w, 1); }
  });
  const mon = (x, y, z, ry, live) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    scene.add(g);
    rbox(1.12, 0.78, 0.09, mat(0x0a0f1c, 0.4, 0.8), 0, 0, 0, g, 0.04);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.64), live
      ? new THREE.MeshStandardMaterial({ map: termTex, emissive: 0xffffff, emissiveMap: termTex, emissiveIntensity: 1.2, roughness: 0.6 })
      : new THREE.MeshPhysicalMaterial({ color: 0x04070d, roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }));
    scr.position.z = 0.047;
    g.add(scr);
    cyl(0.05, 0.08, 0.3, mat(0x0a0f1c, 0.5, 0.8), 0, -0.55, -0.02, g, 16);
    return g;
  };
  mon(-1.35, 1.28, -1.2, 0.28, false);
  mon(1.35, 1.28, -1.2, -0.28, false);
  const term = mon(0, 1.34, -1.25, 0, true);
  register('terminal', term);
  register('console', term);
  const termLight = new THREE.PointLight(accent, 3, 6, 2);
  termLight.position.set(0, 0.9, -0.3);
  scene.add(termLight);

  // ---- airlock hatch (left) ----------------------------------------------------------------------
  const hatch = new THREE.Group();
  hatch.position.set(-2.7, 0, -1.9);
  scene.add(hatch);
  const hf = mat(0x1c2742, 0.4, 0.85);
  rbox(0.25, 2.4, 0.18, hf, -0.725, 1.2, 0, hatch, 0.03);
  rbox(0.25, 2.4, 0.18, hf, 0.725, 1.2, 0, hatch, 0.03);
  rbox(1.7, 0.2, 0.18, hf, 0, 2.3, 0, hatch, 0.03);
  rbox(1.7, 0.2, 0.18, hf, 0, 0.1, 0, hatch, 0.03);
  // hazard stripe along the top of the frame
  const hz = canvasTex(512, 32, (ctx, w, h) => { ctx.fillStyle = '#15171f'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffb020'; for (let x = -40; x < w + 40; x += 48) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 24, h); ctx.lineTo(x + 48, 0); ctx.lineTo(x + 24, 0); ctx.fill(); } });
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.1), new THREE.MeshStandardMaterial({ map: hz, roughness: 0.6 }));
  stripe.position.set(0, 2.33, 0.095);
  hatch.add(stripe);
    if (open) {
    const tun = new THREE.MeshStandardMaterial({ color: 0x0b2a1a, emissive: 0x0a5a30, emissiveIntensity: 0.9, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide });
    for (const [px, py, pw, ph, rx, ry] of [[-0.6, 1.15, 3.2, 2.0, 0, Math.PI / 2], [0.6, 1.15, 3.2, 2.0, 0, -Math.PI / 2], [0, 2.15, 1.2, 3.2, Math.PI / 2, 0], [0, 0.15, 1.2, 3.2, -Math.PI / 2, 0]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), tun);
      p.position.set(px, py, -1.5);
      p.rotation.set(rx, ry, 0);
      hatch.add(p);
    }
    for (let i = 0; i < 6; i++) {
      const z = -0.2 - i * 0.5;
      rbox(1.2, 0.06, 0.06, glowMat(0x3dff9a, 2.6), 0, 2.12, z, hatch, 0.01);
      rbox(1.2, 0.06, 0.06, glowMat(0x3dff9a, 2.6), 0, 0.18, z, hatch, 0.01);
      rbox(0.06, 2.0, 0.06, glowMat(0x3dff9a, 2.6), -0.57, 1.15, z, hatch, 0.01);
      rbox(0.06, 2.0, 0.06, glowMat(0x3dff9a, 2.6), 0.57, 1.15, z, hatch, 0.01);
    }
    rbox(1.2, 2.0, 0.05, glowMat(0xb8ffd8, 3.2), 0, 1.15, -3.2, hatch, 0.01);
    const tl = new THREE.PointLight(0x3dff9a, 9, 5, 2);
    tl.position.set(-2.7, 1.3, -1.2);
    scene.add(tl);
    const dh = new THREE.Group();
    dh.position.set(-0.62, 1.15, 0.1);
    hatch.add(dh);
    const door = cyl(0.56, 0.56, 0.12, mat(0x3a4d78, 0.35, 0.9), 0.56, 0, 0.0, dh, 48);
    door.rotation.x = Math.PI / 2;
    dh.rotation.y = -1.2;
  } else {
    const door = cyl(0.62, 0.62, 0.14, mat(0x3a4d78, 0.32, 0.92), 0, 1.15, 0.1, hatch, 64);
    door.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 20, 64), mat(0x5b7299, 0.3, 0.95));
    rim.position.set(0, 1.15, 0.17); rim.castShadow = true; hatch.add(rim);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 16, 48), mat(0x9fb4d2, 0.3, 1));
    wheel.position.set(0, 1.15, 0.24); wheel.castShadow = true; hatch.add(wheel);
    for (let i = 0; i < 3; i++) {
      const sp = rbox(0.62, 0.05, 0.05, mat(0x9fb4d2, 0.3, 1), 0, 1.15, 0.24, hatch, 0.015);
      sp.rotation.z = (i * Math.PI) / 3;
    }
    sphere(0.06, mat(0x9fb4d2, 0.3, 1), 0, 1.15, 0.26, hatch, 20);
  }
  const lampCol = open ? 0x3dff9a : 0xff3b4e;
  sphere(0.07, glowMat(lampCol, 3.5), 0, 2.2, 0.12, hatch, 20);
  const lampL = new THREE.PointLight(lampCol, 5, 4, 2);
  lampL.position.set(-2.7, 2.1, -1.5);
  scene.add(lampL);
  const statusTex = canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = open ? '#3dff9a' : '#ff3b4e';
    ctx.font = '700 62px Arial Black, Arial'; ctx.textAlign = 'center';
    ctx.fillText(open ? 'OPEN' : 'SEALED', w / 2, 84);
  });
  const status = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshStandardMaterial({ map: statusTex, emissive: 0xffffff, emissiveMap: statusTex, emissiveIntensity: 1.2 }));
  status.position.set(0, 0.45, 0.1);
  hatch.add(status);
  register('airlock', hatch);

  // deck sign
  const signTex = canvasTex(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#1a1405'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffb020'; ctx.lineWidth = 8; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#ffc94d'; ctx.font = '700 92px Arial Black, Arial'; ctx.textAlign = 'center';
    ctx.fillText('DECK 07', w / 2, 112);
  });
  const sign = new THREE.Group();
  sign.position.set(-2.7, 2.62, -1.88);
  scene.add(sign);
  rbox(1.45, 0.48, 0.06, mat(0x0a0e18, 0.5, 0.7), 0, 0, 0, sign, 0.03);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.4), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.5 }));
  signFace.position.z = 0.035;
  sign.add(signFace);
  const signL = new THREE.PointLight(0xffb020, 2.6, 3.5, 2);
  signL.position.set(-2.7, 2.5, -1.3);
  scene.add(signL);
  register('decksign', sign);

  // ---- whiteboard (right) ---------------------------------------------------------------------------
  const wbTex = canvasTex(640, 440, (ctx, w, h) => {
    ctx.fillStyle = '#b9c6d6'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b3a8a'; ctx.font = '600 52px Consolas, monospace'; ctx.fillText('PIN = ?', 50, 90);
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(50, 150); ctx.quadraticCurveTo(200, 110, 340, 160); ctx.quadraticCurveTo(450, 200, 580, 140); ctx.stroke();
    ctx.strokeStyle = '#1b3a8a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(70, 250); ctx.lineTo(160, 340); ctx.moveTo(160, 250); ctx.lineTo(70, 340); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,90,43,0.55)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(470, 300, 66, 0, Math.PI * 2); ctx.stroke();
  });
  const wb = new THREE.Group();
  wb.position.set(2.5, 1.95, -1.9);
  scene.add(wb);
  rbox(1.62, 1.12, 0.06, mat(0x9fb4d2, 0.3, 0.9), 0, 0, 0, wb, 0.03);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshStandardMaterial({ map: wbTex, roughness: 0.55, emissive: 0x1a2330, emissiveMap: wbTex, emissiveIntensity: 0.12 }));
  board.position.z = 0.032;
  wb.add(board);
  rbox(0.5, 0.05, 0.08, mat(0x7d93b8, 0.3, 0.9), -0.4, -0.6, 0.05, wb, 0.02);
  register('whiteboard', wb);
  const wbL = new THREE.SpotLight(0xdbe8ff, 4, 6, 0.9, 0.8, 1.5);
  wbL.position.set(2.2, 2.9, -0.6);
  wbL.target.position.set(2.5, 1.9, -1.9);
  scene.add(wbL, wbL.target);

  // side console
  rbox(1.6, 0.95, 0.55, deskM, 2.6, 0.48, -1.55, scene, 0.04);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), new THREE.MeshPhysicalMaterial({ color: 0x05080f, roughness: 0.15, clearcoat: 1 }));
    m.position.set(2.15 + i * 0.45, 0.78, -1.265);
    m.rotation.x = -0.4;
    scene.add(m);
  }
  for (let i = 0; i < 10; i++) rbox(0.05, 0.02, 0.05, i % 3 === 0 ? glowMat(0xffb020, 2) : mat(0x1b2a44, 0.5, 0.2), 2.0 + i * 0.12, 0.97, -1.3, scene, 0.006);

  // ---- foreground chair -------------------------------------------------------------------------------------
  const chair = new THREE.Group();
  chair.position.set(1.85, 0, 1.0);
  chair.rotation.y = -0.6;
  chair.visible = false;
  cyl(0.05, 0.05, 0.5, mat(0x39486b, 0.35, 0.9), 0, 0.3, 0, chair, 16);
  for (let i = 0; i < 5; i++) { const leg = rbox(0.5, 0.04, 0.06, mat(0x1b2740, 0.4, 0.8), 0, 0.05, 0, chair, 0.015); leg.rotation.y = (i / 5) * Math.PI * 2; leg.position.x = Math.cos(leg.rotation.y) * 0.0; }
  rbox(0.6, 0.12, 0.58, mat(0x233a63, 0.85, 0), 0, 0.58, 0, chair, 0.06);
  rbox(0.58, 0.8, 0.1, mat(0x233a63, 0.85, 0), 0, 1.0, -0.3, chair, 0.06);

  // ---- lights --------------------------------------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x7a92c8, 0x141828, 1.35));
  const key = new THREE.SpotLight(0xbfd6ff, 60, 18, 0.95, 0.9, 1.5);
  key.position.set(0.4, 2.8, 3.2);
  key.target.position.set(0, 1.0, -2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);
  for (const x of [-1.2, 1.2]) {
    rbox(0.9, 0.05, 0.2, glowMat(0xcfe6ff, 1.5), x, 2.94, -0.2, scene, 0.015);
    const sl = new THREE.SpotLight(0x9fc4ff, 14, 8, 0.9, 0.9, 1.6);
    sl.position.set(x, 2.9, -0.2);
    sl.target.position.set(x, 0.5, -1.2);
    scene.add(sl, sl.target);
  }
  return { scene, camera: cam };
}
