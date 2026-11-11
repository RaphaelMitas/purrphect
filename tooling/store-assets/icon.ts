import { writeFile } from "node:fs/promises";
import { CAT_ASPECT, catSvg } from "@purrphect/ui/cat-svg";
import { type TokenSet, tripletToHex } from "@purrphect/ui/theme";
import tokens from "@purrphect/ui/tokens";
import { chromium } from "playwright";
import { here } from "./rig.ts";

const SIZE = 1024;
const RIM = 490;
const DOUBLE_OUT = 462;
const DOUBLE_IN = 393;
const DISC = 305;
const CAT_WIDTH = 380;
const CORNER = SIZE * 0.22;
// Android masks an adaptive layer down to its middle 61%
const ADAPTIVE_SCALE = 0.64;

interface Colors {
  page: string;
  face: string;
  single: string;
  singleAlt: string;
  pink: string;
  mint: string;
}

const colors = (set: TokenSet): Colors => ({
  page: tripletToHex(set.background),
  face: tripletToHex(set["board-face"]),
  single: tripletToHex(set["board-single"]),
  singleAlt: tripletToHex(set["board-single-alt"]),
  pink: tripletToHex(set.pink),
  mint: tripletToHex(set.mint),
});

const LIGHT = colors(tokens.light);
const DARK = colors(tokens.dark);
const INK: Colors = { page: "none", face: "none", single: "none", singleAlt: "none", pink: "#000", mint: "none" };

function band(inner: number, outer: number, top: string, next: string) {
  const ring = `r="${(inner + outer) / 2}" fill="none" stroke-width="${outer - inner}"`;
  return [
    `<circle ${ring} stroke="${next}"/>`,
    `<circle ${ring} stroke="${top}" pathLength="20" stroke-dasharray="1" transform="rotate(9)"/>`,
  ].join("");
}

function art(c: Colors, { blush = true } = {}) {
  const wires = Array.from(
    { length: 10 },
    (_, i) =>
      `<line y1="${-DOUBLE_OUT}" y2="${DOUBLE_OUT}" stroke="${c.face}" stroke-width="6" transform="rotate(${9 + 18 * i})"/>`,
  );
  const cat = `data:image/svg+xml;utf8,${encodeURIComponent(catSvg(c.pink, { blush }))}`;
  const catHeight = CAT_WIDTH * CAT_ASPECT;
  return [
    `<circle r="${RIM}" fill="${c.face}"/>`,
    band(DISC, DOUBLE_IN, c.single, c.singleAlt),
    band(DOUBLE_IN, DOUBLE_OUT, c.pink, c.mint),
    ...wires,
    `<circle r="${DOUBLE_IN}" fill="none" stroke="${c.face}" stroke-width="6"/>`,
    `<circle r="${DISC}" fill="${c.page}" stroke="${c.face}" stroke-width="10"/>`,
    `<image href="${cat}" x="${-CAT_WIDTH / 2}" y="${-catHeight / 2 - 5}" width="${CAT_WIDTH}" height="${catHeight}"/>`,
  ].join("");
}

const full = (c: Colors, corner = 0) =>
  `<rect x="${-SIZE / 2}" y="${-SIZE / 2}" width="${SIZE}" height="${SIZE}" rx="${corner}" fill="${c.page}"/>${art(c)}`;

const adaptive = (body: string) => `<g transform="scale(${ADAPTIVE_SCALE})">${body}</g>`;

// Android reads only the alpha of a monochrome layer: ink turns opaque, the cat's white details turn into holes
const monochrome = (body: string) =>
  `<filter id="ink" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 -.33 -.34 -.33 1 0"/></filter><g filter="url(#ink)">${body}</g>`;

const svg = (body: string, size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}">${body}</svg>`;

const PNGS: [path: string, size: number, body: string][] = [
  ["apps/dart/assets/icon.png", SIZE, full(LIGHT)],
  ["apps/dart/assets/icon-dark.png", SIZE, full(DARK)],
  ["apps/dart/assets/android-icon-foreground.png", SIZE, adaptive(art(LIGHT))],
  ["apps/dart/assets/android-icon-monochrome.png", SIZE, monochrome(adaptive(art(INK, { blush: false })))],
  ["apps/dart/assets/favicon.png", 48, full(LIGHT, CORNER)],
  ["apps/dart-web/public/icon.png", 64, full(LIGHT, CORNER)],
  ["apps/dart-web/public/apple-touch-icon.png", 180, full(LIGHT)],
];

const root = (path: string) => here(`../../${path}`);

await writeFile(root("assets/icon.svg"), `${svg(full(LIGHT, CORNER), 64)}\n`);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [path, size, body] of PNGS) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${svg(body, size)}</body>`, { waitUntil: "load" });
    await page.screenshot({ path: root(path), omitBackground: true });
    console.log(path);
  }
} finally {
  await browser.close();
}
