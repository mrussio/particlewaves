import * as THREE from "three";
import vert from "./particle.vert.glsl?raw";
import frag from "./particle.frag.glsl?raw";
import { state, onStateChange } from "../state";

const GRADIENT_MODE_INDEX = { velocity: 0, age: 1, position: 2 } as const;

export class ParticleSystem {
  readonly object: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private currentCount: number;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uTimeScale: { value: state.timeScale },
        uCurlStrength: { value: state.curlStrength },
        uCurlScale: { value: state.curlScale },
        uMouseForce: { value: state.mouseForce },
        uMousePos: { value: new THREE.Vector3(999, 999, 999) },
        uMouseActive: { value: 0 },
        uSize: { value: state.size },
        uSizeJitter: { value: state.sizeJitter },
        uGradientMode: { value: GRADIENT_MODE_INDEX[state.gradientMode] },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uViewportH: { value: window.innerHeight },
        uColorA: { value: new THREE.Color(state.colorA) },
        uColorB: { value: new THREE.Color(state.colorB) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    this.currentCount = state.count;
    this.geometry = this.buildGeometry(this.currentCount);
    this.object = new THREE.Points(this.geometry, this.material);
    this.object.frustumCulled = false;

    onStateChange((key) => this.onStateChange(key));
  }

  private buildGeometry(count: number): THREE.BufferGeometry {
    const seeds = new Float32Array(count * 3);
    const ids = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i * 3 + 0] = (Math.random() - 0.5) * 8.0;
      seeds[i * 3 + 1] = (Math.random() - 0.5) * 8.0;
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 8.0;
      ids[i] = i / count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
    geo.setAttribute("aId", new THREE.BufferAttribute(ids, 1));
    geo.setAttribute("position", new THREE.BufferAttribute(seeds, 3));
    geo.setDrawRange(0, count);
    return geo;
  }

  private rebuildGeometry(count: number): void {
    const old = this.geometry;
    this.geometry = this.buildGeometry(count);
    this.object.geometry = this.geometry;
    this.currentCount = count;
    old.dispose();
  }

  private onStateChange(key: keyof typeof state): void {
    const u = this.material.uniforms;
    switch (key) {
      case "count":
        if (state.count !== this.currentCount) this.rebuildGeometry(state.count);
        break;
      case "size":
        u.uSize.value = state.size;
        break;
      case "sizeJitter":
        u.uSizeJitter.value = state.sizeJitter;
        break;
      case "colorA":
        u.uColorA.value.set(state.colorA);
        break;
      case "colorB":
        u.uColorB.value.set(state.colorB);
        break;
      case "gradientMode":
        u.uGradientMode.value = GRADIENT_MODE_INDEX[state.gradientMode];
        break;
      case "curlStrength":
        u.uCurlStrength.value = state.curlStrength;
        break;
      case "curlScale":
        u.uCurlScale.value = state.curlScale;
        break;
      case "timeScale":
        u.uTimeScale.value = state.timeScale;
        break;
      case "mouseForce":
        u.uMouseForce.value = state.mouseForce;
        break;
    }
  }

  setMouse(world: THREE.Vector3, active: boolean): void {
    this.material.uniforms.uMousePos.value.copy(world);
    this.material.uniforms.uMouseActive.value = active ? 1 : 0;
  }

  setViewport(h: number, pixelRatio: number): void {
    this.material.uniforms.uViewportH.value = h;
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  update(elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
  }
}
