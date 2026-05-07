import {
  state,
  notify,
  applyPatch,
  onStateChange,
  type State,
  type GradientMode,
  type PresetName,
} from "../state";
import { PRESETS } from "../presets";

type SliderOpts = {
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function fmt2(v: number): string {
  return v.toFixed(2);
}
function fmtCount(v: number): string {
  if (v >= 100_000) return `${Math.round(v / 1000)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function setStateKey<K extends keyof State>(k: K, v: State[K]): void {
  Object.assign(state, { [k]: v });
  notify(k);
}

function row(label: string): { row: HTMLDivElement; mount: HTMLDivElement } {
  const r = el("div", "row");
  r.appendChild(el("span", "row-label", label));
  const m = el("div", "row-mount");
  r.appendChild(m);
  return { row: r, mount: m };
}

function slider(k: keyof State, label: string, opts: SliderOpts): HTMLDivElement {
  const { row: r, mount } = row(label);
  const wrap = el("div", "slider-wrap");
  const input = document.createElement("input");
  input.type = "range";
  input.className = "slider";
  input.min = String(opts.min);
  input.max = String(opts.max);
  input.step = String(opts.step);
  const value = el("span", "row-value");
  const fmt = opts.format ?? fmt2;

  const sync = (): void => {
    const v = state[k] as number;
    input.value = String(v);
    value.textContent = fmt(v);
    const pct = ((v - opts.min) / (opts.max - opts.min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);
  };
  sync();

  input.addEventListener("input", () => {
    setStateKey(k, parseFloat(input.value) as never);
  });
  onStateChange((key) => {
    if (key === k) sync();
  });

  wrap.appendChild(input);
  mount.appendChild(wrap);
  mount.appendChild(value);
  return r;
}

function colorRow(k: keyof State, label: string): HTMLDivElement {
  const { row: r, mount } = row(label);
  const swatch = el("button", "swatch");
  swatch.type = "button";
  swatch.style.background = state[k] as string;

  const input = document.createElement("input");
  input.type = "color";
  input.className = "color-input";
  input.value = state[k] as string;
  input.tabIndex = -1;

  swatch.addEventListener("click", () => input.click());
  input.addEventListener("input", () => {
    setStateKey(k, input.value as never);
    swatch.style.background = input.value;
  });
  onStateChange((key) => {
    if (key === k) {
      input.value = state[k] as string;
      swatch.style.background = state[k] as string;
    }
  });

  mount.appendChild(swatch);
  mount.appendChild(input);
  return r;
}

function segmented<T extends string>(
  k: keyof State,
  label: string,
  options: T[],
): HTMLDivElement {
  const { row: r, mount } = row(label);
  const group = el("div", "segmented");
  const buttons = new Map<T, HTMLButtonElement>();
  for (const opt of options) {
    const b = el("button", "seg-btn");
    b.type = "button";
    b.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    b.addEventListener("click", () => setStateKey(k, opt as never));
    buttons.set(opt, b);
    group.appendChild(b);
  }
  const sync = (): void => {
    for (const [opt, btn] of buttons) {
      btn.classList.toggle("active", state[k] === opt);
    }
  };
  sync();
  onStateChange((key) => {
    if (key === k) sync();
  });
  mount.appendChild(group);
  return r;
}

function presetGrid(): HTMLDivElement {
  const wrap = el("div", "preset-grid");
  const presets: PresetName[] = ["Aurora", "Plasma", "Constellation", "Inkwell", "Nebula"];
  const buttons = new Map<PresetName, HTMLButtonElement>();
  for (const p of presets) {
    const b = el("button", "preset-chip");
    b.type = "button";
    b.textContent = p;
    b.addEventListener("click", () => setStateKey("preset", p));
    buttons.set(p, b);
    wrap.appendChild(b);
  }
  const sync = (): void => {
    for (const [p, b] of buttons) {
      b.classList.toggle("active", state.preset === p);
    }
  };
  sync();
  onStateChange((k) => {
    if (k === "preset") sync();
  });
  return wrap;
}

function section(title: string, children: HTMLElement[]): HTMLElement {
  const s = el("section", "panel-section");
  s.appendChild(el("h3", "section-label", title));
  const stack = el("div", "stack");
  for (const c of children) stack.appendChild(c);
  s.appendChild(stack);
  return s;
}

function divider(): HTMLElement {
  return el("div", "divider");
}

function savePresetJSON(): void {
  const { preset: _p, ...rest } = state;
  const blob = new Blob([JSON.stringify(rest, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `particles-preset-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function buildPanel(onSavePNG: () => void): void {
  const body = document.getElementById("panel-body");
  const collapseBtn = document.getElementById("panel-collapse");
  const panel = document.getElementById("panel");
  if (!body || !collapseBtn || !panel) return;

  body.appendChild(
    section("Particles", [
      slider("count", "Count", { min: 1000, max: 500_000, step: 1000, format: fmtCount }),
      slider("size", "Size", { min: 0.5, max: 8, step: 0.05 }),
      slider("sizeJitter", "Jitter", { min: 0, max: 1, step: 0.01 }),
    ]),
  );
  body.appendChild(divider());

  body.appendChild(
    section("Color", [
      colorRow("colorA", "Color A"),
      colorRow("colorB", "Color B"),
      segmented<GradientMode>("gradientMode", "Map by", ["velocity", "age", "position"]),
      colorRow("bgColorTop", "BG top"),
      colorRow("bgColorBottom", "BG bottom"),
    ]),
  );
  body.appendChild(divider());

  body.appendChild(
    section("Motion", [
      slider("curlStrength", "Strength", { min: 0, max: 2, step: 0.01 }),
      slider("curlScale", "Scale", { min: 0.1, max: 5, step: 0.01 }),
      slider("timeScale", "Speed", { min: 0, max: 3, step: 0.01 }),
      slider("mouseForce", "Mouse", { min: -2, max: 2, step: 0.01 }),
    ]),
  );
  body.appendChild(divider());

  body.appendChild(
    section("Bloom", [
      slider("bloomStrength", "Strength", { min: 0, max: 2, step: 0.01 }),
      slider("bloomThreshold", "Threshold", { min: 0, max: 1, step: 0.01 }),
      slider("bloomRadius", "Radius", { min: 0, max: 2, step: 0.01 }),
    ]),
  );
  body.appendChild(divider());

  const presets = el("section", "panel-section");
  presets.appendChild(el("h3", "section-label", "Presets"));
  presets.appendChild(presetGrid());
  body.appendChild(presets);

  body.appendChild(divider());

  const actions = el("div", "panel-actions");
  const btnPng = el("button", "btn", "Save image");
  btnPng.type = "button";
  btnPng.addEventListener("click", onSavePNG);
  const btnJson = el("button", "btn", "Save preset");
  btnJson.type = "button";
  btnJson.addEventListener("click", savePresetJSON);
  actions.appendChild(btnPng);
  actions.appendChild(btnJson);
  body.appendChild(actions);

  collapseBtn.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
  });

  onStateChange((k) => {
    if (k === "bgColorTop") {
      document.documentElement.style.setProperty("--bg-top", state.bgColorTop);
    } else if (k === "bgColorBottom") {
      document.documentElement.style.setProperty("--bg-bottom", state.bgColorBottom);
    } else if (k === "preset") {
      applyPatch(PRESETS[state.preset]);
    }
  });
}
