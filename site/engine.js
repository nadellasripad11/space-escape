// real-time renderer: loads a scene module, runs bloom + grade, mouse parallax, hover outline, camera moves
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as kit from '../render3d/kit.js';

kit.live.on = true;

const ray = new THREE.Raycaster();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.reducedMotion = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.quality = 1;
    this.mouse = new THREE.Vector2(0, 0);
    this.mouseSmooth = new THREE.Vector2(0, 0);
    this.shake = 0;
    this.time = 0;
    this.frames = 0;
    this.slow = 0;
    this.api = null;
    this.mod = null;
    this.scene = null;
    this.camera = null;
    this.names = new Map();
    this.hover = null;
    this.allowed = null;
    this.basePos = new THREE.Vector3();
    this.baseQuat = new THREE.Quaternion();
    this.parallax = 1;
    this.onFrame = null;
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * this.quality;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setPixelRatio(dpr);
      this.composer.setSize(w, h);
      this.outline.setSize(w * dpr, h * dpr);
    }
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  async load(name, state) {
    kit.clearRegistry();
    kit.clearTweens();
    const mod = await import('../render3d/scenes/' + name + '.js');
    const built = await mod.build(state || '', kit);
    this.mod = mod;
    this.scene = built.scene;
    this.camera = built.camera;
    this.api = built.api || {};
    this.renderer.toneMappingExposure = mod.exposure || 1;
    this.camera.fov = (this.camera.fov || 55) * 1.0;

    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * this.quality;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);

    const target = new THREE.WebGLRenderTarget(w * dpr, h * dpr, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.outline = new OutlinePass(new THREE.Vector2(w * dpr, h * dpr), this.scene, this.camera);
    this.outline.edgeStrength = 4;
    this.outline.edgeGlow = 1.2;
    this.outline.edgeThickness = 2;
    this.outline.visibleEdgeColor.set(0x6fe3ff);
    this.outline.hiddenEdgeColor.set(0x1b4a66);
    this.composer.addPass(this.outline);
    const b = mod.bloom || { strength: 0.5, radius: 0.6, threshold: 0.9 };
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), b.strength * 1.15, b.radius, b.threshold);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.composer.addPass(new ShaderPass(kit.gradeShader(mod.grade || {})));

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.basePos.copy(this.camera.position);
    this.baseQuat.copy(this.camera.quaternion);
    this.shake = 0;
    this.hover = null;
    this.names = new Map();
    for (const [n, obj] of Object.entries(kit.getRegistry())) {
      const list = this.names.get(obj) || [];
      list.push(n);
      this.names.set(obj, list);
    }
    return this.api;
  }

  // which registered object is under the pointer (only names in `allowed`)
  pick(clientX, clientY) {
    if (!this.scene) return null;
    const r = this.canvas.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2 - 1;
    const y = -((clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera({ x, y }, this.camera);
    const hits = ray.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      let o = h.object;
      let ok = true;
      for (let p = o; p; p = p.parent) if (p.visible === false) { ok = false; break; }
      if (!ok || o.isPoints || o.isLine) continue;
      if (o.material && o.material.transparent && o.material.opacity < 0.2) continue;
      for (let p = o; p; p = p.parent) {
        const names = this.names.get(p);
        if (names) {
          const name = names.find((n) => !this.allowed || this.allowed.has(n));
          if (name) return { name, object: p };
        }
      }
      // the nearest solid thing was something non-interactive: stop (it blocks the click)
      if (o.material && !o.material.transparent) return null;
    }
    return null;
  }

  setHover(hit) {
    this.hover = hit;
    if (hit) {
      this.outline.selectedObjects = [hit.object];
    } else {
      // show a faint outline on ALL interactive objects when nothing is hovered
      const reg = kit.getRegistry();
      this.outline.selectedObjects = this.allowed
        ? Object.entries(reg).filter(([n]) => this.allowed.has(n)).map(([, o]) => o)
        : [];
    }
  }

  screenPos(obj) {
    const v = this.worldCenter(obj).project(this.camera);
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (1 - (v.y * 0.5 + 0.5)) * r.height };
  }

  worldCenter(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    return box.getCenter(new THREE.Vector3());
  }

  // dolly the camera toward an object (the base pose that parallax rides on)
  async focus(obj, dist, ms) {
    const c = this.worldCenter(obj);
    const toPos = new THREE.Vector3(c.x * 0.85, c.y + 0.05, c.z + (dist || 2.3));
    return this.moveTo(toPos, c, ms || 800);
  }

  async moveTo(pos, lookAt, ms) {
    const cam = new THREE.PerspectiveCamera();
    cam.position.copy(pos);
    cam.lookAt(lookAt);
    const fromP = this.basePos.clone();
    const fromQ = this.baseQuat.clone();
    const toQ = cam.quaternion.clone();
    this.parallax = 0.25;
    await kit.tweenValue(0, 1, ms, (v) => {
      this.basePos.lerpVectors(fromP, pos, v);
      this.baseQuat.slerpQuaternions(fromQ, toQ, v);
    }, kit.ease.inOut);
  }

  async reset(ms) {
    if (!this.home) return;
    const fromP = this.basePos.clone();
    const fromQ = this.baseQuat.clone();
    await kit.tweenValue(0, 1, ms || 700, (v) => {
      this.basePos.lerpVectors(fromP, this.home.pos, v);
      this.baseQuat.slerpQuaternions(fromQ, this.home.quat, v);
    }, kit.ease.inOut);
    this.parallax = 1;
  }

  markHome() {
    this.home = { pos: this.basePos.clone(), quat: this.baseQuat.clone() };
    this.parallax = 1;
  }

  frame(dtMs) {
    const dt = Math.min(dtMs, 100) / 1000;
    this.time += dt;
    kit.tick(Math.min(dtMs, 100));
    if (this.api && this.api.update) this.api.update(this.time, dt);
    this.mouseSmooth.lerp(this.mouse, 1 - Math.pow(0.001, dt));
    const ep = this.reducedMotion ? 0 : this.parallax;
    const mx = this.mouseSmooth.x * ep;
    const my = this.mouseSmooth.y * ep;
    const off = new THREE.Vector3(mx * 0.34, my * 0.16, 0).applyQuaternion(this.baseQuat);
    this.camera.position.copy(this.basePos).add(off);
    if (this.shake > 0.0001) {
      this.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake));
      this.shake *= Math.pow(0.02, dt);
    }
    tmpE.set(my * 0.018, -mx * 0.03, 0);
    this.camera.quaternion.copy(this.baseQuat).multiply(tmpQ.setFromEuler(tmpE));
    // idle objects pulse faintly even without hover so players can find them
    if (this.hover) {
      this.outline.edgeStrength = 5 + 3 * (0.5 + 0.5 * Math.sin(this.time * 7));
      this.outline.edgeGlow = 2.2;
    } else if (this.allowed && this.allowed.size > 0) {
      // subtle ambient pulse on all interactive objects
      this.outline.edgeStrength = 0.8 + 0.5 * (0.5 + 0.5 * Math.sin(this.time * 1.8));
      this.outline.edgeGlow = 0.4;
    }
    this.composer.render(dt);

    // adaptive resolution: keep it smooth on weak gpus
    this.frames++;
    if (dtMs > 38) this.slow++;
    else this.slow = Math.max(0, this.slow - 0.25);
    if (this.frames > 60 && this.slow > 40 && this.quality > 0.55) {
      this.quality = Math.max(0.55, this.quality - 0.15);
      this.slow = 0;
      this.resize();
    }
    if (this.onFrame) this.onFrame(dt);
  }

  run() {
    let last = performance.now();
    const loop = (now) => {
      const d = now - last;
      last = now;
      if (this.scene) this.frame(d);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
