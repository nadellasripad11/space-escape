// open space: planet + stars + sun. used behind the launch and win screens.
export const exposure = 1.0;
export const bloom = { strength: 0.55, radius: 0.8, threshold: 0.8 };
export const grade = { vignette: 0.4, grain: 0.035, tint: [1.0, 1.01, 1.06], lift: [0.0, 0.003, 0.01] };

export async function build(state, kit) {
  const { THREE, starfield, planet } = kit;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  const cam = new THREE.PerspectiveCamera(38, 1.6, 0.1, 400);
  cam.position.set(0, 2, 26);
  cam.lookAt(0, 0.5, 0);
  const stars = starfield(3200, 200, 21);
  stars.material.fog = false;
  scene.add(stars);
  const pl = planet(42, 9);
  pl.position.set(10, -40, -12);
  pl.rotation.set(0.25, 0.4, 0);
  scene.add(pl);
  const sun = new THREE.DirectionalLight(0xfff0dd, 4.4);
  sun.position.set(-30, 30, 10);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x4c6aa8, 0.6));
  // sun glare
  const glare = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.8, 3.1), transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glare.position.set(-34, 22, -80);
  glare.lookAt(cam.position);
  scene.add(glare);
  return { scene, camera: cam };
}
