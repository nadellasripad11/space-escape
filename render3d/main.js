import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as kit from '/kit.js';

const q = new URLSearchParams(location.search);
const name = q.get('scene');
const state = q.get('state') || '';
const SCALE = Number(q.get('scale') || 1.5);
const W = Math.round(1440 * SCALE);
const H = Math.round(900 * SCALE);

window.__log = [];
const log = (...a) => window.__log.push(a.join(' '));

try {
  const mod = await import('/scenes/' + name + '.js');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!mod.alpha });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mod.exposure || 1;
  if (mod.alpha) renderer.setClearColor(0x000000, 0);
  document.body.appendChild(renderer.domElement);

  const { scene, camera } = await mod.build(state, kit);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();

  if (mod.alpha) {
    renderer.render(scene, camera);
  } else {
    const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, target);
    composer.setSize(W, H);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = mod.bloom || { strength: 0.6, radius: 0.6, threshold: 0.85 };
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
    composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass(kit.gradeShader(mod.grade || {})));
    composer.render();
  }
  window.__regions = kit.projectRegions(camera, 1440, 900);
  window.__png = (type, quality) => renderer.domElement.toDataURL(type, quality);
  window.__ready = true;
} catch (e) {
  window.__error = String(e && e.stack ? e.stack : e);
}
