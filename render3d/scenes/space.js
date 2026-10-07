// open space: planet + stars + sun. used behind the launch and win screens.
export const exposure = 1.0;
export const bloom = { strength: 0.55, radius: 0.8, threshold: 0.8 };
export const grade = { vignette: 0.4, grain: 0.035, tint: [1.0, 1.01, 1.06], lift: [0.0, 0.003, 0.01] };

import { makePod } from '../podmodel.js';

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
  const pod = makePod({ ready: true, flame: true });
  pod.visible = false;
  scene.add(pod);
  scene.add(new THREE.HemisphereLight(0xaac4ff, 0x203050, 1.0));
  const api = {
    pod,
    async fly() {
      pod.visible = true;
      pod.scale.setScalar(1.1);
      pod.rotation.set(0.04, -0.35, 0.06);
      await kit.tweenValue(0, 1, 6000, (v) => {
        pod.position.set(-11 + v * 26, 3.4 - v * 1.7 + Math.sin(v * 5) * 0.15, 7 - v * 6.5);
        pod.scale.setScalar(1.1 * (1 - v * 0.55));
      }, kit.ease.inOut);
    },
    update(t, dt) { pod.userData.update(t); },
  };
  return { scene, camera: cam, api };
}
