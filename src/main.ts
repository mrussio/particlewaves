import * as THREE from "three";
import { ParticleSystem } from "./particles/system";
import { buildComposer } from "./post/bloom";
import { buildPanel } from "./ui/panel";
import { state } from "./state";

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const cursorGlow = document.getElementById("cursor-glow") as HTMLDivElement;
const fpsEl = document.getElementById("hud-fps") as HTMLDivElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 9);

const particles = new ParticleSystem();
scene.add(particles.object);

const { composer, resize } = buildComposer(renderer, scene, camera);

const mouseNDC = new THREE.Vector2(0, 0);
const mouseWorld = new THREE.Vector3(999, 999, 999);
let mouseActive = false;
const raycaster = new THREE.Raycaster();
const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

window.addEventListener("pointermove", (e) => {
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -((e.clientY / window.innerHeight) * 2 - 1);
  raycaster.setFromCamera(mouseNDC, camera);
  raycaster.ray.intersectPlane(planeZ0, mouseWorld);
  mouseActive = true;
  cursorGlow.style.transform = `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
});
window.addEventListener("pointerleave", () => {
  mouseActive = false;
});

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  resize(w, h);
  particles.setViewport(h, Math.min(window.devicePixelRatio, 2));
});

function savePNG() {
  renderer.domElement.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `particles-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, "image/png");
}

window.addEventListener("keydown", (e) => {
  if (e.key === "h" || e.key === "H") {
    document.body.classList.toggle("ui-hidden");
  } else if (e.key === "s" || e.key === "S") {
    savePNG();
  }
});

document.documentElement.style.setProperty("--bg-top", state.bgColorTop);
document.documentElement.style.setProperty("--bg-bottom", state.bgColorBottom);

buildPanel(savePNG);

const clock = new THREE.Clock();
let frames = 0;
let fpsAcc = 0;
function tick() {
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  particles.setMouse(mouseWorld, mouseActive);
  particles.update(elapsed);
  composer.render();

  fpsAcc += dt;
  frames += 1;
  if (fpsAcc >= 0.5) {
    fpsEl.textContent = `${Math.round(frames / fpsAcc)} fps`;
    frames = 0;
    fpsAcc = 0;
  }
  requestAnimationFrame(tick);
}
tick();
