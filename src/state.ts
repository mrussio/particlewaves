export type GradientMode = "velocity" | "age" | "position";
export type PresetName =
  | "Aurora"
  | "Plasma"
  | "Constellation"
  | "Inkwell"
  | "Nebula";

export interface State {
  count: number;
  size: number;
  sizeJitter: number;

  colorA: string;
  colorB: string;
  gradientMode: GradientMode;
  bgColorTop: string;
  bgColorBottom: string;

  curlStrength: number;
  curlScale: number;
  timeScale: number;
  mouseForce: number;

  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  trails: number;

  preset: PresetName;
}

export const state: State = {
  count: 100_000,
  size: 2.4,
  sizeJitter: 0.4,

  colorA: "#ff5edf",
  colorB: "#00d4ff",
  gradientMode: "velocity",
  bgColorTop: "#1a0b2e",
  bgColorBottom: "#0a3d5c",

  curlStrength: 0.9,
  curlScale: 1.4,
  timeScale: 1.0,
  mouseForce: 0.6,

  bloomStrength: 0.65,
  bloomThreshold: 0.4,
  bloomRadius: 0.8,
  trails: 0.0,

  preset: "Aurora",
};

type Listener = (key: keyof State) => void;
const listeners = new Set<Listener>();

export function onStateChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(key: keyof State): void {
  for (const fn of listeners) fn(key);
}

export function applyPatch(patch: Partial<State>): void {
  for (const k of Object.keys(patch) as (keyof State)[]) {
    Object.assign(state, { [k]: patch[k] });
    notify(k);
  }
}
