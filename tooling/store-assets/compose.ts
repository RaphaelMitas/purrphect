import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CAT_ASPECT, catSvg } from "@purrphect/ui/cat-svg";
import { chromium } from "playwright";
import { DEVICE_NAMES, type Device, type Entry, isRecord, parseManifest } from "./manifest.ts";
import { decor, escapeHtml, FONT, fill, here, px, THEME } from "./rig.ts";

const DEVICES = {
  iphone: { width: 1320, height: 2868, frame: "iphone", bezel: 0.035, radius: 0.13 },
  // captured by hand: Maestro 2.3 only sees the closed outer panel of an unfolded Duo
  "iphone-duo": { width: 2853, height: 2007, frame: "tablet", bezel: 0.035, radius: 0.06 },
  ipad: { width: 2752, height: 2064, frame: "tablet", bezel: 0.035, radius: 0.035 },
  "android-phone": { width: 1440, height: 2560, frame: "android", bezel: 0.03, radius: 0.09 },
  "android-tablet": { width: 2560, height: 1440, frame: "tablet", bezel: 0.035, radius: 0.035 },
} as const satisfies Record<Device, unknown>;
type Spec = (typeof DEVICES)[Device];

interface Caption {
  capture: string;
  caption: string;
  cat: string;
}

const [capturesArg] = process.argv.slice(2);
if (!capturesArg) {
  console.error("Usage: node compose.ts <captures-dir>");
  process.exit(1);
}
const capturesDir = resolve(capturesArg);
const outDir = here("../../apps/dart-web/public/screenshots");

const isCaption = (v: unknown): v is Caption =>
  isRecord(v) && typeof v.capture === "string" && typeof v.caption === "string" && typeof v.cat === "string";

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const captions = readJson(here("captions.json"));
if (!Array.isArray(captions) || !captions.every(isCaption)) throw new Error("captions.json is malformed");
const template = readFileSync(here("template.html"), "utf8");

function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
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
  const peek = catW * CAT_ASPECT * 0.56;
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
      "screen-radius": spec.radius * Math.min(screenW, screenH),
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
  const fills: Record<string, string> = {
    VARS: css,
    THEME,
    FONT,
    DECOR: decor(index, u, spec),
    CAPTION: escapeHtml(caption.caption),
    CAT: catSvg(caption.cat),
    FRAME: spec.frame,
    BUTTONS: buttons(spec.frame, u, deviceW, deviceH),
    SCREEN: `data:image/png;base64,${png.toString("base64")}`,
  };
  return fill(template, fills);
}

const manifestPath = join(outDir, "manifest.json");
const manifest = parseManifest(existsSync(manifestPath) ? readJson(manifestPath) : undefined);

const browser = await chromium.launch();
try {
  for (const device of DEVICE_NAMES) {
    const dir = join(capturesDir, device);
    if (!existsSync(dir)) {
      console.warn(`No captures for ${device}, keeping its previous screenshots`);
      continue;
    }
    const spec = DEVICES[device];
    const missing = captions.filter((c) => !existsSync(join(dir, `${c.capture}.png`))).map((c) => c.capture);
    if (missing.length) throw new Error(`${device} is missing captures: ${missing.join(", ")}`);
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
      entries.push({ file, caption: caption.caption, width: spec.width, height: spec.height });
      console.log(file);
    }
    await page.close();
    manifest.devices[device] = entries;
  }
} finally {
  await browser.close();
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
