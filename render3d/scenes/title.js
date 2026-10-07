// title: the station seen from outside, planet below. left third stays dark for the title text.
export const exposure = 1.0;
export const bloom = { strength: 0.5, radius: 0.8, threshold: 0.85 };
export const grade = { vignette: 0.45, grain: 0.035, tint: [1.0, 1.01, 1.06], lift: [0.0, 0.003, 0.01] };

export async function build(state, kit) {
  const { THREE, mat, glowMat, rbox, cyl, sphere, starfield, planet, register, rng } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  const cam = new THREE.PerspectiveCamera(30, 1.6, 0.1, 600);
  cam.position.set(0, 2, 62);
  cam.lookAt(0, 0, 0);

  const stars = starfield(3000, 200, 8);
  stars.material.fog = false;
  scene.add(stars);

  const pl = planet(30, 5);
  pl.position.set(30, -34, -34);
  pl.rotation.set(0.3, 0.8, 0);
  scene.add(pl);

  const sun = new THREE.DirectionalLight(0xfff0dd, 6.5);
  sun.position.set(-30, 25, 20);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x6f8cc8, 1.1));
  const rim = new THREE.DirectionalLight(0x4aa8ff, 1.4);
  rim.position.set(20, -5, -10);
  scene.add(rim);

  // station
  const st = new THREE.Group();
  st.position.set(13, 7.5, 0);
  st.rotation.set(0.55, -0.55, 0.15);
  scene.add(st);
  const hullM = mat(0x8fa2c2, 0.35, 0.85);
  const darkM = mat(0x222d47, 0.4, 0.85);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.9, 32, 128), hullM);
  ring.castShadow = true;
  st.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.35, 16, 128), darkM);
  ring2.scale.set(1, 1, 1.0);
  ring2.position.z = 0;
  ring2.rotation.x = 0;
  st.add(ring2);
  // window lights around the ring
  const r = rng(3);
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    if (r() < 0.25) continue;
    const warm = r() < 0.7;
    const w = rbox(0.28, 0.12, 0.12, glowMat(warm ? 0xffd9a0 : 0x7fd8ff, 2.2), Math.cos(a) * 9.35, Math.sin(a) * 9.35, 0, st, 0.02);
    w.rotation.z = a;
  }
  // spokes + hub
  for (let i = 0; i < 4; i++) {
    const sp = rbox(8.3, 0.28, 0.28, darkM, 0, 0, 0, st, 0.05);
    sp.rotation.z = (i * Math.PI) / 4 + 0.2;
  }
  const hub = cyl(1.5, 1.5, 6.5, hullM, 0, 0, 0, st, 64);
  hub.rotation.x = Math.PI / 2;
  const cap = cyl(0.8, 1.2, 1.4, darkM, 0, 0, 4.0, st, 48);
  cap.rotation.x = Math.PI / 2;
  const mast = cyl(0.09, 0.09, 6, mat(0x6f86ad, 0.3, 0.95), 0, 0, 7.2, st, 12);
  mast.rotation.x = Math.PI / 2;
  const beacon = sphere(0.22, glowMat(0xff3b4e, 6), 0, 0, 10.3, st, 16);
  // solar wings on the hub
  for (const sx of [-1, 1]) {
    const arm = rbox(0.18, 0.18, 4, darkM, sx * 2.0, 0, 0, st, 0.04);
    const panel = rbox(0.06, 4.4, 5.2, new THREE.MeshStandardMaterial({ color: 0x14306b, emissive: 0x0a1f4d, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.8 }), sx * 2.6, 0, -0.6, st, 0.03);
    panel.rotation.y = sx * 0.12;
  }
  register('station', st);

  // a distant second ring-segment fragment for depth
  const frag = rbox(3, 0.5, 0.5, darkM, -4, 9, -30, scene, 0.05);
  frag.rotation.set(0.5, 0.4, 0.8);
  return { scene, camera: cam };
}
