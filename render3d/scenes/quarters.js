// sleeping quarters. state: closed | open | empty
export const exposure = 1.0;
export const bloom = { strength: 0.42, radius: 0.6, threshold: 0.9 };
export const grade = { vignette: 0.5, grain: 0.03, tint: [1.0, 1.02, 1.07], lift: [0.004, 0.004, 0.012] };

export async function build(state, kit) {
  const { THREE, mat, glowMat, rbox, cyl, sphere, plane, place, panelMaps, noiseRough, canvasTex, starfield, planet, register, rng } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080f);
  scene.fog = new THREE.FogExp2(0x160b14, 0.045);

  const cam = new THREE.PerspectiveCamera(56, 1.6, 0.1, 100);
  cam.position.set(-0.25, 1.5, 3.7);
  cam.lookAt(0.0, 1.33, -2);

  const held = state === 'empty';
  const doorCol = held ? 0x3dff9a : 0xff3b4e;

  // ---- shell ---------------------------------------------------------------------
  const wallM = panelMaps({ base: '#2b3956', repeat: [3, 1.5], cells: 4, seed: 4 });
  const wall = mat(0xffffff, 0.55, 0.45, { map: wallM.map, bumpMap: wallM.bump, bumpScale: 2.2, roughnessMap: noiseRough(2, [3, 1.5]) });
  const floorM = panelMaps({ base: '#27334f', repeat: [7, 7], cells: 4, seed: 8, grime: 0.55 });
  const floorMat = mat(0xffffff, 0.32, 0.65, { map: floorM.map, bumpMap: floorM.bump, bumpScale: 2.5, roughnessMap: noiseRough(5, [7, 7]) });
  const ceilM = panelMaps({ base: '#141c30', repeat: [4, 4], cells: 4, seed: 12 });
  const ceilMat = mat(0xffffff, 0.7, 0.3, { map: ceilM.map, bumpMap: ceilM.bump, bumpScale: 2 });

  const back = plane(7, 3, wall, 0, 1.5, -2, scene);
  const left = plane(7.5, 3, wall, -3.5, 1.5, 1.75, scene);
  left.rotation.y = Math.PI / 2;
  const right = plane(7.5, 3, wall, 3.5, 1.5, 1.75, scene);
  right.rotation.y = -Math.PI / 2;
  const floor = plane(7, 7.5, floorMat, 0, 0, 1.75, scene);
  floor.rotation.x = -Math.PI / 2;
  const ceil = plane(7, 7.5, ceilMat, 0, 3, 1.75, scene);
  ceil.rotation.x = Math.PI / 2;

  // trims
  const trim = mat(0x0b111e, 0.5, 0.7);
  rbox(7, 0.2, 0.12, trim, 0, 0.1, -1.94, scene, 0.02);
  rbox(7, 0.025, 0.02, glowMat(0x27d3ff, 2.2), 0, 0.22, -1.9, scene, 0.005);
  rbox(7, 0.07, 0.05, trim, 0, 2.35, -1.97, scene, 0.01);
  rbox(7, 0.24, 0.2, trim, 0, 2.88, -1.88, scene, 0.02);
  for (const sx of [-1, 1]) {
    rbox(0.1, 3, 0.1, trim, sx * 3.45, 1.5, -1.95, scene, 0.02);
  }
  // ceiling pipes
  for (let i = 0; i < 3; i++) cyl(0.05, 0.05, 7, mat(0x39486b, 0.35, 0.85), 0, 2.78 - i * 0.12, -1.7 - i * 0.04, scene, 20).rotation.z = Math.PI / 2;

  // ---- bunk (against back wall, left) ------------------------------------------------
  const bunk = new THREE.Group();
  scene.add(bunk);
  const steel = mat(0x6d7f9f, 0.35, 0.9);
  const post = (x, z) => cyl(0.035, 0.035, 2.0, steel, x, 1.0, z, bunk, 16);
  post(-3.3, -1.95); post(-1.2, -1.95); post(-3.3, -1.05); post(-1.2, -1.05);
  const mattress = mat(0x3a4d78, 0.9, 0);
  const blanketBlue = mat(0x1d3a78, 0.95, 0);
  const blanketRed = mat(0x7a2a3c, 0.95, 0);
  const pillow = mat(0xaebbd6, 0.9, 0);
  for (const [y, blanket] of [[0.46, blanketRed], [1.42, blanketBlue]]) {
    rbox(2.1, 0.07, 0.9, steel, -2.25, y - 0.14, -1.5, bunk, 0.02);
    rbox(2.05, 0.2, 0.86, mattress, -2.25, y, -1.5, bunk, 0.08);
    rbox(0.5, 0.14, 0.34, pillow, -3.0, y + 0.16, -1.5, bunk, 0.07);
    const b = rbox(1.35, 0.14, 0.88, blanket, -1.72, y + 0.1, -1.5, bunk, 0.06);
    b.rotation.z = (y > 1 ? 0.02 : -0.03);
  }
  // guard rail + ladder
  rbox(2.1, 0.05, 0.04, steel, -2.25, 1.78, -1.06, bunk, 0.01);
  for (let i = 0; i < 7; i++) cyl(0.02, 0.02, 0.5, steel, -1.2 - 0.0, 0.25 + i * 0.27, -0.98, bunk, 12).rotation.z = Math.PI / 2;
  cyl(0.025, 0.025, 1.95, steel, -1.43, 1.0, -0.98, bunk, 12);
  cyl(0.025, 0.025, 1.95, steel, -0.97, 1.0, -0.98, bunk, 12);
  register('bunk', bunk);

  // ---- porthole ----------------------------------------------------------------------
  const ph = new THREE.Group();
  ph.position.set(-2.25, 2.35, -1.96);
  scene.add(ph);
  const view = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.7) + ')';
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    const g = ctx.createRadialGradient(330, 380, 60, 330, 380, 300);
    g.addColorStop(0, '#2a7be0');
    g.addColorStop(0.55, '#14427f');
    g.addColorStop(0.8, '#0a2347');
    g.addColorStop(1, 'rgba(10,35,71,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(330, 380, 300, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,210,255,0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(330, 380, 298, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.43, 64), new THREE.MeshBasicMaterial({ map: view, color: 0xffffff }));
  disc.position.z = 0.02;
  ph.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.07, 24, 64), mat(0x7388ad, 0.3, 0.9));
  ring.castShadow = true;
  ph.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 16, 64), mat(0x1b2740, 0.5, 0.8));
  ph.add(ring2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bolt = cyl(0.025, 0.025, 0.05, mat(0xaabbd8, 0.3, 1), Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.05, ph, 12);
    bolt.rotation.x = Math.PI / 2;
  }
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.43, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false }));
  glass.position.z = 0.05;
  ph.add(glass);
  const phLight = new THREE.PointLight(0x4aa8ff, 3.5, 5, 2);
  phLight.position.set(-2.25, 2.3, -1.2);
  scene.add(phLight);
  register('porthole', ph);

  // ---- vent ----------------------------------------------------------------------------
  const vent = new THREE.Group();
  vent.position.set(0.55, 2.55, -1.94);
  scene.add(vent);
  rbox(1.3, 0.5, 0.06, mat(0x1b2740, 0.4, 0.85), 0, 0, 0, vent, 0.03);
  rbox(1.18, 0.38, 0.04, mat(0x020308, 0.9, 0), 0, 0, 0.03, vent, 0.02);
  for (let i = 0; i < 6; i++) {
    const s = rbox(1.14, 0.025, 0.05, mat(0x4a5f88, 0.35, 0.9), 0, 0.14 - i * 0.056, 0.05, vent, 0.008);
    s.rotation.x = -0.35;
  }
  const ventGlow = new THREE.PointLight(0x3dff9a, 1.6, 1.6, 2);
  ventGlow.position.set(0.55, 2.55, -1.6);
  scene.add(ventGlow);
  register('vent', vent);

  // ---- poster ---------------------------------------------------------------------------
  const posterTex = canvasTex(512, 700, (ctx, w, h) => {
    ctx.fillStyle = '#9fb0c8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b6dff'; ctx.fillRect(0, 0, w, 100);
    ctx.fillStyle = '#fff'; ctx.font = '700 46px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.fillText('CREW ROSTER', w / 2, 66);
    for (let i = 0; i < 8; i++) {
      const y = 140 + i * 66;
      ctx.fillStyle = '#9fb4d2'; ctx.fillRect(40, y, 46, 28);
      ctx.fillStyle = '#6f8fb0'; ctx.fillRect(110, y + 8, 330 - (i % 3) * 50, 14);
    }
    ctx.fillStyle = '#c3d4e6'; ctx.fillRect(100, 664, 300, 22);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const poster = new THREE.Group();
  poster.position.set(-0.55, 1.5, -1.95);
  poster.rotation.z = 0.012;
  scene.add(poster);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.09), new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.8, emissive: 0x101a2a, emissiveMap: posterTex, emissiveIntensity: 0.06 }));
  paper.position.z = 0.012;
  paper.castShadow = true;
  poster.add(paper);
  for (const sx of [-1, 1]) {
    const tape = rbox(0.14, 0.04, 0.012, mat(0xe8d9a8, 0.8, 0), sx * 0.34, 0.53, 0.02, poster, 0.004);
    tape.rotation.z = sx * 0.2;
  }
  register('poster', poster);

  // ---- locker -------------------------------------------------------------------------------
  const locker = new THREE.Group();
  locker.position.set(0.95, 0, -1.7);
  scene.add(locker);
  const lockSteel = mat(0x405577, 0.38, 0.85);
  const shell = mat(0x1a2540, 0.45, 0.8);
  const inner = mat(0x16223a, 0.7, 0.3);
  rbox(1.0, 2.1, 0.05, inner, 0, 1.05, -0.27, locker, 0.01);        // back
  rbox(0.05, 2.1, 0.6, shell, -0.475, 1.05, 0, locker, 0.01);       // sides
  rbox(0.05, 2.1, 0.6, shell, 0.475, 1.05, 0, locker, 0.01);
  rbox(1.0, 0.05, 0.6, shell, 0, 2.075, 0, locker, 0.01);           // top / bottom
  rbox(1.0, 0.05, 0.6, shell, 0, 0.025, 0, locker, 0.01);
  for (const y of [0.62, 1.28]) rbox(0.9, 0.04, 0.52, mat(0x4a5f88, 0.4, 0.85), 0, y, 0.0, locker, 0.01); // shelves
  rbox(0.22, 0.6, 0.16, mat(0x2a3a5c, 0.9, 0), -0.22, 1.62, -0.1, locker, 0.05);   // jacket
  rbox(0.3, 0.2, 0.2, mat(0x2a3a5c, 0.9, 0), 0.18, 0.74, 0.0, locker, 0.05);       // boots
  const hinge = new THREE.Group();
  hinge.position.set(-0.46, 1.05, 0.31);
  locker.add(hinge);
  const door = new THREE.Group();
  door.position.x = 0.46;
  hinge.add(door);
  rbox(0.92, 2.06, 0.06, lockSteel, 0, 0, 0, door, 0.025);
  for (let i = 0; i < 5; i++) rbox(0.56, 0.026, 0.03, mat(0x070a12, 0.8, 0.2), 0, 0.82 - i * 0.07, 0.04, door, 0.008);
  rbox(0.05, 0.36, 0.05, mat(0xaebbd8, 0.25, 1), 0.34, 0, 0.06, door, 0.02);
  rbox(0.34, 0.12, 0.02, mat(0x0d1424, 0.5, 0.6), 0, -0.7, 0.035, door, 0.01);
  const lockLed = sphere(0.025, glowMat(state === 'closed' ? 0xff3b4e : 0x3dff9a, 3), -0.35, -0.55, 0.05, door, 12);
  hinge.rotation.y = state === 'closed' ? 0 : -1.75;
  register('locker', locker);

  if (state === 'open') {
    const cardTex = canvasTex(512, 320, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2b7bff'); g.addColorStop(1, '#0b2d7a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 70, w, 58);
      ctx.fillStyle = '#ffd23b'; ctx.fillRect(40, 190, 100, 80);
      ctx.fillStyle = '#fff'; ctx.font = '700 64px Arial Black, Arial'; ctx.fillText('LVL 2', 180, 250);
    });
    const base = mat(0x0b2d7a, 0.5, 0);
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.21, 0.014), [base, base, base, base, new THREE.MeshStandardMaterial({ map: cardTex, emissive: 0x4a8bff, emissiveMap: cardTex, emissiveIntensity: 1.6, roughness: 0.25 }), base]);
    card.position.set(0.0, 1.41, -0.1);
    card.rotation.set(-0.28, 0.0, 0.05);
    card.castShadow = true;
    locker.add(card);
    register('keycard', card);
    const cl = new THREE.PointLight(0xaed4ff, 3.2, 3, 2);
    cl.position.set(0.95, 1.7, -1.15);
    scene.add(cl);
  }

  // ---- door ------------------------------------------------------------------------------------
  const dg = new THREE.Group();
  dg.position.set(2.6, 0, -1.9);
  scene.add(dg);
  rbox(1.6, 2.4, 0.14, mat(0x0a0e18, 0.5, 0.7), 0, 1.2, 0, dg, 0.03);
  const dpan = mat(0x2d3e60, 0.4, 0.85);
  rbox(0.68, 2.2, 0.08, dpan, -0.36, 1.1, 0.07, dg, 0.02);
  rbox(0.68, 2.2, 0.08, dpan, 0.36, 1.1, 0.07, dg, 0.02);
  for (const sx of [-0.36, 0.36]) {
    rbox(0.4, 0.8, 0.02, mat(0x070b14, 0.3, 0.2), sx, 1.55, 0.115, dg, 0.02);
    rbox(0.4, 0.8, 0.012, new THREE.MeshStandardMaterial({ color: 0x0a1020, emissive: doorCol, emissiveIntensity: 0.08, roughness: 0.2 }), sx, 1.55, 0.125, dg, 0.02);
  }
  rbox(1.2, 0.07, 0.05, glowMat(doorCol, 3.2), 0, 2.33, 0.1, dg, 0.02);
  const reader = rbox(0.18, 0.34, 0.08, mat(0x101828, 0.4, 0.7), -1.05, 1.15, 0.0, dg, 0.02);
  rbox(0.1, 0.012, 0.03, mat(0x000000, 1, 0), -1.05, 1.25, 0.05, dg, 0.004);
  sphere(0.022, glowMat(doorCol, 3.5), -1.05, 1.05, 0.05, dg, 12);
  const dl = new THREE.PointLight(doorCol, held ? 3.5 : 4.5, 4.5, 2);
  dl.position.set(2.2, 2.2, -1.1);
  scene.add(dl);
  register('door', dg);

  // ---- foreground props -------------------------------------------------------------------------
  const crate = rbox(0.9, 0.55, 0.6, mat(0x354868, 0.5, 0.7), 2.5, 0.28, 0.3, scene, 0.04);
  crate.rotation.y = -0.25;
  rbox(0.7, 0.06, 0.4, mat(0xffb020, 0.5, 0.2), 2.5, 0.58, 0.3, scene, 0.02).rotation.y = -0.25;
  const trunk = rbox(0.8, 0.4, 0.5, mat(0x2b3a58, 0.45, 0.75), -1.45, 0.2, -0.2, scene, 0.05);
  trunk.rotation.y = 0.35;

  // ---- lights ----------------------------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x8a98c0, 0x151522, 1.35));
  for (const x of [-1.6, 1.4]) {
    const s = new THREE.SpotLight(0xff3a48, 16, 14, 0.8, 0.8, 1.6);
    s.position.set(x, 2.85, 0.4);
    s.target.position.set(x * 0.6, 1.3, -2);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0004;
    scene.add(s, s.target);
    rbox(0.5, 0.06, 0.2, glowMat(0xff3040, 3.5), x, 2.93, 0.4, scene, 0.02);
  }
  const fill = new THREE.SpotLight(0xbcd0ff, 70, 18, 0.95, 0.9, 1.5);
  fill.position.set(0.5, 2.6, 3.4);
  fill.target.position.set(0, 1.2, -2);
  fill.castShadow = true;
  fill.shadow.mapSize.set(1024, 1024);
  scene.add(fill, fill.target);
  const floorBounce = new THREE.PointLight(0x2a62ff, 1.2, 6, 2);
  floorBounce.position.set(0, 0.35, -1);
  scene.add(floorBounce);

  return { scene, camera: cam };
}
