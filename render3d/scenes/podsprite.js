// the lifeboat flying away, transparent background. state: (none)
import { makePod } from '/podmodel.js';
export const alpha = true;
export const exposure = 1.05;

export async function build(state, kit) {
  const { THREE } = kit;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(24, 1.6, 0.1, 100);
  cam.position.set(1.5, 2.2, 15);
  cam.lookAt(-0.6, 0, 0);
  const pod = makePod({ ready: true, flame: true });
  pod.rotation.y = -0.45;
  pod.rotation.z = 0.06;
  scene.add(pod);
  scene.add(new THREE.HemisphereLight(0xaac4ff, 0x203050, 1.6));
  const sun = new THREE.DirectionalLight(0xfff0dd, 4);
  sun.position.set(-6, 8, 6);
  scene.add(sun);
  return { scene, camera: cam };
}
