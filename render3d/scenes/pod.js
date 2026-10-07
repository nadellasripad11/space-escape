// pod bay. state: dead | ready
import { makePod } from '/podmodel.js';

export const exposure = 1.0;
export const bloom = { strength: 0.36, radius: 0.6, threshold: 0.92 };
export const grade = { vignette: 0.5, grain: 0.03, tint: [1.0, 1.01, 1.05], lift: [0.004, 0.004, 0.012] };

export async function build(state, kit) {
  const { THREE, mat, glowMat, rbox, cyl, sphere, plane, panelMaps, noiseRough, canvasTex, starfield, planet, register, rng } = kit;
  const ready = state === 'ready';
  const accent = ready ? 0x3dff9a : 0xffb020;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.fog = new THREE.FogExp2(0x0a1220, 0.022);

  const cam = new THREE.PerspectiveCamera(56, 1.6, 0.1, 140);
  cam.position.set(0.1, 1.55, 4.0);
  cam.lookAt(0.0, 1.2, -2);

  // ---- shell with a big bay window --------------------------------------------------------
  const wm = panelMaps({ base: '#2d3d5e', repeat: [0.5, 0.5], cells: 4, seed: 31 });
  const wall = mat(0xffffff, 0.5, 0.5, { map: wm.map, bumpMap: wm.bump, bumpScale: 2.2 });
  const shape = new THREE.Shape();
  shape.moveTo(-3.5, 0); shape.lineTo(3.5, 0); shape.lineTo(3.5, 3.2); shape.lineTo(-3.5, 3.2); shape.lineTo(-3.5, 0);
  const hole = new THREE.Path();
  hole.moveTo(0.7, 0.55); hole.lineTo(3.2, 0.55); hole.lineTo(3.2, 2.85); hole.lineTo(0.7, 2.85); hole.lineTo(0.7, 0.55);
  shape.holes.push(hole);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(shape), wall);
  back.position.z = -2;
  scene.add(back);
  const sideM = panelMaps({ base: '#2d3d5e', repeat: [3, 1.5], cells: 4, seed: 33 });
  const sideWall = mat(0xffffff, 0.5, 0.5, { map: sideM.map, bumpMap: sideM.bump, bumpScale: 2.2 });
  const left = plane(7.5, 3.2, sideWall, -3.5, 1.6, 1.75, scene); left.rotation.y = Math.PI / 2;
  const right = plane(7.5, 3.2, sideWall, 3.5, 1.6, 1.75, scene); right.rotation.y = -Math.PI / 2;
  const fm = panelMaps({ base: '#2b3753', repeat: [7, 7], cells: 4, seed: 38, grime: 0.6 });
  const floor = plane(7, 7.5, mat(0xffffff, 0.3, 0.65, { map: fm.map, bumpMap: fm.bump, bumpScale: 2.5, roughnessMap: noiseRough(5, [7, 7]) }), 0, 0, 1.75, scene);
  floor.rotation.x = -Math.PI / 2;
  const cm = panelMaps({ base: '#18223a', repeat: [4, 4], cells: 4, seed: 12 });
  const ceil = plane(7, 7.5, mat(0xffffff, 0.7, 0.3, { map: cm.map, bumpMap: cm.bump, bumpScale: 2 }), 0, 3.2, 1.75, scene);
  ceil.rotation.x = Math.PI / 2;

  // hazard floor band
  const hz = canvasTex(1024, 64, (ctx, w, h) => { ctx.fillStyle = '#15171f'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffb020'; for (let x = -64; x < w + 64; x += 64) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 32, h); ctx.lineTo(x + 64, 0); ctx.lineTo(x + 32, 0); ctx.fill(); } });
  hz.wrapS = THREE.RepeatWrapping; hz.repeat.set(2, 1);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.35), new THREE.MeshStandardMaterial({ map: hz, roughness: 0.5, metalness: 0.4 }));
  band.rotation.x = -Math.PI / 2; band.position.set(0, 0.012, -0.55); band.receiveShadow = true;
  scene.add(band);

  const trim = mat(0x0b111e, 0.5, 0.7);
  rbox(7, 0.2, 0.12, trim, 0, 0.1, -1.94, scene, 0.02);
  rbox(7, 0.025, 0.02, glowMat(accent, 2.2), 0, 0.22, -1.9, scene, 0.005);
  rbox(7, 0.26, 0.2, trim, 0, 3.08, -1.88, scene, 0.02);
  for (const sx of [-1, 1]) rbox(0.1, 3.2, 0.1, trim, sx * 3.45, 1.6, -1.95, scene, 0.02);

  // bay window frame + space
  const frameM = mat(0x16213a, 0.35, 0.85);
  rbox(2.7, 0.14, 0.22, frameM, 1.95, 2.9, -1.9, scene, 0.03);
  rbox(2.7, 0.14, 0.22, frameM, 1.95, 0.5, -1.9, scene, 0.03);
  rbox(0.14, 2.4, 0.22, frameM, 0.65, 1.7, -1.9, scene, 0.03);
  rbox(0.14, 2.4, 0.22, frameM, 3.25, 1.7, -1.9, scene, 0.03);
  rbox(0.07, 2.3, 0.12, frameM, 1.95, 1.7, -1.95, scene, 0.02);
  const pl = planet(8, 17);
  pl.position.set(1.0, -3.2, -14);
  pl.traverse((o) => { if (o.material && o.material.fog !== undefined) o.material.fog = false; });
  scene.add(pl);
  const stars = starfield(1800, 70, 6);
  stars.material.fog = false;
  stars.position.y = 2;
  scene.add(stars);
  const sun = new THREE.DirectionalLight(0xffeedd, 3.2);
  sun.position.set(-8, 7, -4);
  sun.target.position.set(1, -3, -14);
  scene.add(sun, sun.target);
  register('window', new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.3, 0.1)).translateX(1.95).translateY(1.7).translateZ(-1.95));

  // ---- the lifeboat on its cradle ----------------------------------------------------------------
  const pod = makePod({ ready });
  pod.position.set(0.35, 1.12, -0.7);
  scene.add(pod);
  pod.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const cradleM = mat(0x2a3a5c, 0.4, 0.85);
  for (const x of [-0.6, 1.5]) {
    rbox(0.18, 0.42, 1.5, cradleM, x, 0.21, -0.7, scene, 0.03);
    rbox(0.2, 0.2, 1.3, cradleM, x, 0.42, -0.7, scene, 0.05);
  }
  rbox(3.5, 0.08, 0.14, cradleM, 0.45, 0.05, -0.3, scene, 0.02);
  rbox(3.5, 0.08, 0.14, cradleM, 0.45, 0.05, -1.1, scene, 0.02);
  const podRegion = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.6, 1.5)); podRegion.position.set(0.35, 1.12, -0.7); podRegion.visible = false; scene.add(podRegion);
  register('pod', podRegion);
  const hatchRegion = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.05, 0.2)); hatchRegion.position.set(0.0, 1.1, 0.07); hatchRegion.visible = false; scene.add(hatchRegion);
  register('hatch', hatchRegion);

  // ---- control pedestal (left) ------------------------------------------------------------------------
  const ped = new THREE.Group();
  ped.position.set(-1.95, 0, 0.45);
  scene.add(ped);
  rbox(1.15, 0.9, 0.75, mat(0x1e2b49, 0.4, 0.8), 0, 0.45, 0, ped, 0.05);
  const slope = new THREE.Group();
  slope.position.set(0, 1.02, 0.02);
  slope.rotation.x = 0.95;
  ped.add(slope);
  rbox(1.15, 0.12, 0.8, mat(0x33466d, 0.35, 0.85), 0, 0, 0, slope, 0.04);
  const screenTex = canvasTex(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#05080c'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 300);
    g.addColorStop(0, ready ? 'rgba(61,255,154,0.25)' : 'rgba(255,59,78,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ready ? '#3dff9a' : '#ff3b4e';
    ctx.font = '700 54px Consolas, monospace'; ctx.textAlign = 'center';
    if (ready) ctx.fillText('POD READY', w / 2, 170);
    else { ctx.fillText('NO POWER', w / 2, 130); ctx.font = '600 38px Consolas, monospace'; ctx.fillText('WIRES UNPLUGGED', w / 2, 200); }
    for (let y = 0; y < h; y += 4) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, y, w, 1); }
  });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.59), new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.2, roughness: 0.5 }));
  scr.rotation.x = -Math.PI / 2;
  scr.position.set(0, 0.07, 0.0);
  slope.add(scr);
  if (ready) {
    const btn = cyl(0.1, 0.1, 0.06, glowMat(0x3dff9a, 3), 0.0, 0.09, 0.28, slope, 40);
    register('launchbtn', btn);
  } else {
    for (let i = 0; i < 3; i++) cyl(0.045, 0.045, 0.05, mat(0x05070d, 0.8, 0.2), -0.25 + i * 0.25, 0.07, 0.28, slope, 24);
  }
  register('panel', ped);

  // wires
  const wireCols = [0xff3b4e, 0x3b9bff, 0xffd23b];
  wireCols.forEach((c, i) => {
    const x0 = -0.25 + i * 0.25;
    const curve = ready
      ? new THREE.CatmullRomCurve3([new THREE.Vector3(-1.95 + x0, 0.9, -0.1), new THREE.Vector3(-1.5 + i * 0.1, 0.25, 0.7), new THREE.Vector3(-1.2 + i * 0.1, 0.04, 0.3 - i * 0.2), new THREE.Vector3(-1.5, 0.6, -0.6)])
      : new THREE.CatmullRomCurve3([new THREE.Vector3(-1.95 + x0, 0.9, 0.2), new THREE.Vector3(-1.9 + x0 * 1.6, 0.35, 0.65 + i * 0.1), new THREE.Vector3(-1.6 + x0 * 2.2, 0.05, 0.9 + i * 0.08), new THREE.Vector3(-1.3 + x0 * 2.5, 0.04, 1.1 + i * 0.1)]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.028, 12), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: ready ? 0.9 : 0.12, roughness: 0.5 }));
    tube.castShadow = true;
    scene.add(tube);
    const endP = curve.getPoint(1);
    rbox(0.1, 0.05, 0.07, mat(0xc3d4e6, 0.3, 0.9), endP.x, endP.y, endP.z, scene, 0.015);
  });

  // manual
  const manTex = canvasTex(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#b9c6d8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = '#fff'; ctx.font = '700 30px Arial Black, Arial'; ctx.textAlign = 'center'; ctx.fillText('POD MANUAL', w / 2, 44);
    ctx.fillStyle = '#8fa0bb';
    for (let i = 0; i < 6; i++) ctx.fillRect(24, 96 + i * 30, 170 - (i % 2) * 50, 10);
  });
  const manual = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshStandardMaterial({ map: manTex, roughness: 0.8, emissive: 0x1a2334, emissiveMap: manTex, emissiveIntensity: 0.1 }));
  manual.position.set(-2.45, 2.0, -1.95);
  manual.rotation.z = 0.05;
  manual.castShadow = true;
  scene.add(manual);
  register('manual', manual);

  // ---- lights ------------------------------------------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x7a92c8, 0x141828, 1.3));
  const key = new THREE.SpotLight(0xdbe8ff, 34, 18, 0.9, 0.9, 1.5);
  key.position.set(-0.4, 3.0, 2.4);
  key.target.position.set(0.0, 1.0, -0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.bias = -0.0003;
  scene.add(key, key.target);
  for (const x of [-2.2, 0.6]) rbox(0.9, 0.05, 0.2, glowMat(accent, 2.0), x, 3.12, -0.6, scene, 0.015);
  const dock = new THREE.PointLight(accent, 8, 7, 2);
  dock.position.set(-1.3, 2.4, -1.2);
  scene.add(dock);
  const panelL = new THREE.PointLight(ready ? 0x3dff9a : 0xff3b4e, 3.4, 3.5, 2);
  panelL.position.set(-1.95, 1.6, 1.3);
  scene.add(panelL);
  const windowFill = new THREE.PointLight(0x4aa8ff, 4, 6, 2);
  windowFill.position.set(1.6, 1.8, -1.0);
  scene.add(windowFill);
  return { scene, camera: cam };
}
