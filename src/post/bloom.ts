import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { state, onStateChange } from "../state";

export function buildComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): { composer: EffectComposer; resize: (w: number, h: number) => void } {
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    size,
    state.bloomStrength,
    state.bloomRadius,
    state.bloomThreshold,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  onStateChange((k) => {
    if (k === "bloomStrength") bloom.strength = state.bloomStrength;
    else if (k === "bloomRadius") bloom.radius = state.bloomRadius;
    else if (k === "bloomThreshold") bloom.threshold = state.bloomThreshold;
  });

  return {
    composer,
    resize: (w, h) => {
      composer.setSize(w, h);
      bloom.setSize(w, h);
    },
  };
}
