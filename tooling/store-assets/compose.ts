import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { catSvg } from "./cat.ts";

const DEVICES = {
  iphone: { width: 1320, height: 2868, frame: "iphone", bezel: 0.035, radius: 0.13 },
  ipad: { width: 2064, height: 2752, frame: "tablet", bezel: 0.035, radius: 0.035 },
  "android-phone": { width: 1440, height: 2560, frame: "android", bezel: 0.03, radius: 0.09 },
  "android-tablet": { width: 2560, height: 1440, frame: "tablet", bezel: 0.035, radius: 0.035 },
} as const;
type Device = keyof typeof DEVICES;
type Spec = (typeof DEVICES)[Device];

interface Caption {
  capture: string;
  caption: string;
  cat?: string;
}
interface Entry {
  file: string;
  caption: string;
}
interface Manifest {
  devices: Partial<Record<Device, Entry[]>>;
}

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const isDevice = (name: string): name is Device => name in DEVICES;

const [capturesArg, outArg = here("../../apps/dart-web/public/screenshots")] = process.argv.slice(2);
if (!capturesArg) {
  console.error("Usage: node compose.ts <captures-dir> [out-dir]");
  process.exit(1);
}
const capturesDir = resolve(capturesArg);
const outDir = resolve(outArg);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isCaption = (v: unknown): v is Caption =>
  isRecord(v) &&
  typeof v.capture === "string" &&
  typeof v.caption === "string" &&
  (v.cat === undefined || typeof v.cat === "string");
const isEntry = (v: unknown): v is Entry => isRecord(v) && typeof v.file === "string" && typeof v.caption === "string";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const captions = readJson(here("captions.json"));
if (!Array.isArray(captions) || !captions.every(isCaption)) throw new Error("captions.json is malformed");
const template = readFileSync(here("template.html"), "utf8");
const font = readFileSync(
  createRequire(import.meta.url).resolve("@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf"),
).toString("base64");

const DECOR = [
  {
    blobs: [
      ["pink-soft", 0.85, 0.08, 0.7],
      ["mint-soft", 0.05, 0.62, 0.55],
      ["butter-soft", 0.95, 0.95, 0.5],
    ],
    dots: ["pink", "mint", "butter"],
  },
  {
    blobs: [
      ["mint-soft", 0.1, 0.1, 0.65],
      ["butter-soft", 0.92, 0.5, 0.5],
      ["pink-soft", 0.15, 0.98, 0.6],
    ],
    dots: ["butter", "pink", "mint"],
  },
  {
    blobs: [
      ["butter-soft", 0.9, 0.12, 0.6],
      ["pink-soft", 0.02, 0.45, 0.6],
      ["mint-soft", 0.8, 0.92, 0.55],
    ],
    dots: ["mint", "butter", "pink"],
  },
] as const;
const DOTS = [
  [0.05, 0.25],
  [0.93, 0.2],
  [0.04, 0.55],
  [0.95, 0.68],
  [0.1, 0.9],
];

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const px = (n: number) => `${Math.round(n * 100) / 100}px`;

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function decor(index: number, u: number, spec: Spec) {
  const set = DECOR[index % DECOR.length] ?? DECOR[0];
  const span = Math.max(spec.width, spec.height);
  const blobs = set.blobs.map(([color, x, y, size]) => {
    const d = size * span;
    return `<div class="blob" style="left:${px(x * spec.width - d / 2)};top:${px(y * spec.height - d / 2)};width:${px(d)};height:${px(d)};background:var(--${color})"></div>`;
  });
  const dots = DOTS.map(
    ([x = 0, y = 0], i) =>
      `<div class="dot" style="left:${px(x * spec.width - u)};top:${px(y * spec.height - u)};background:var(--${set.dots[i % set.dots.length]})"></div>`,
  );
  return [...blobs, ...dots].join("");
}

function layout(spec: Spec, capture: { width: number; height: number }) {
  const portrait = spec.height > spec.width;
  if (portrait !== capture.height > capture.width) {
    throw new Error(`A ${capture.width}x${capture.height} capture does not fit the ${spec.width}x${spec.height} rig`);
  }
  const u = Math.min(spec.width, spec.height) / 100;
  const side = 7 * u;
  const header = (portrait ? 0.15 : 0.2) * spec.height;
  const catW = (portrait ? 24 : 15) * u;
  const peek = catW * (255 / 229) * 0.56;
  const top = header + peek;
  const short = Math.min(capture.width, capture.height);
  const border = 2 * spec.bezel * short;
  const scale = Math.min(
    (spec.width - 2 * side) / (capture.width + border),
    (spec.height - top - 5 * u) / (capture.height + border),
  );
  const bezel = spec.bezel * short * scale;
  const screenW = capture.width * scale;
  const screenH = capture.height * scale;
  const deviceW = screenW + 2 * bezel;
  const deviceH = screenH + 2 * bezel;
  const deviceX = (spec.width - deviceW) / 2;
  const deviceY = top + (spec.height - top - 5 * u - deviceH) / 2;
  return {
    u,
    deviceW,
    deviceH,
    vars: {
      w: spec.width,
      h: spec.height,
      u,
      side,
      header,
      font: (portrait ? 7.4 : 5.2) * u,
      "cat-w": catW,
      "cat-x": deviceX + deviceW * 0.7 - catW / 2,
      "cat-y": deviceY - peek,
      "dev-x": deviceX,
      "dev-y": deviceY,
      "bezel-w": bezel,
      "screen-w": screenW,
      "screen-h": screenH,
      radius: spec.radius * Math.min(screenW, screenH),
    },
  };
}

function buttons(frame: Spec["frame"], u: number, deviceW: number, deviceH: number) {
  const button = (edge: "left" | "right" | "top", from: number, length: number) => {
    const thick = 0.9 * u;
    const style =
      edge === "top"
        ? `top:${px(-thick * 0.8)};left:${px(from * deviceW)};width:${px(length * deviceW)};height:${px(thick)}`
        : `${edge}:${px(-thick * 0.8)};top:${px(from * deviceH)};height:${px(length * deviceH)};width:${px(thick)}`;
    return `<div class="button" style="${style}"></div>`;
  };
  if (frame === "tablet") return [button("top", 0.12, 0.08), button("right", 0.08, 0.06)].join("");
  if (frame === "android") return [button("right", 0.2, 0.06), button("right", 0.3, 0.12)].join("");
  return [
    button("left", 0.16, 0.04),
    button("left", 0.23, 0.07),
    button("left", 0.32, 0.07),
    button("right", 0.26, 0.1),
  ].join("");
}

function render(spec: Spec, caption: Caption, index: number, png: Buffer) {
  const { u, deviceW, deviceH, vars } = layout(spec, pngSize(png));
  const css = Object.entries(vars)
    .map(([k, v]) => `--${k}: ${px(v)};`)
    .join(" ");
  const tokens: Record<string, string> = {
    VARS: css,
    FONT: `data:font/ttf;base64,${font}`,
    DECOR: decor(index, u, spec),
    CAPTION: escapeHtml(caption.caption),
    CAT: catSvg(caption.cat ?? "#FF6FA3"),
    FRAME: spec.frame,
    BUTTONS: buttons(spec.frame, u, deviceW, deviceH),
    SCREEN: `data:image/png;base64,${png.toString("base64")}`,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = tokens[key];
    if (value === undefined) throw new Error(`Unknown template token ${key}`);
    return value;
  });
}

function readManifest(path: string): Manifest {
  const manifest: Manifest = { devices: {} };
  const previous = existsSync(path) ? readJson(path) : undefined;
  if (!isRecord(previous) || !isRecord(previous.devices)) return manifest;
  for (const [device, entries] of Object.entries(previous.devices)) {
    if (isDevice(device) && Array.isArray(entries) && entries.every(isEntry)) manifest.devices[device] = entries;
  }
  return manifest;
}

const manifestPath = join(outDir, "manifest.json");
const manifest = readManifest(manifestPath);

const browser = await chromium.launch();
try {
  for (const device of Object.keys(DEVICES).filter(isDevice)) {
    const dir = join(capturesDir, device);
    if (!existsSync(dir)) {
      console.warn(`No captures for ${device}, keeping its previous screenshots`);
      continue;
    }
    const spec = DEVICES[device];
    await rm(join(outDir, device), { recursive: true, force: true });
    await mkdir(join(outDir, device), { recursive: true });
    const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height } });
    const entries: Entry[] = [];
    for (const [i, caption] of captions.entries()) {
      const png = await readFile(join(dir, `${caption.capture}.png`));
      await page.setContent(render(spec, caption, i, png), { waitUntil: "load" });
      const overflows = await page.evaluate(async () => {
        await document.fonts.ready;
        const h1 = document.querySelector("h1")?.getBoundingClientRect();
        const header = document.querySelector("header")?.getBoundingClientRect();
        return !h1 || !header || h1.height > header.height || h1.width > header.width;
      });
      if (overflows) throw new Error(`"${caption.caption}" does not fit the ${device} caption area`);
      const file = `${device}/${String(i + 1).padStart(2, "0")}-${caption.capture}.png`;
      await page.screenshot({ path: join(outDir, file) });
      entries.push({ file, caption: caption.caption });
      console.log(file);
    }
    await page.close();
    manifest.devices[device] = entries;
  }
} finally {
  await browser.close();
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
