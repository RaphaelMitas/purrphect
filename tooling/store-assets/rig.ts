import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import tokens from "@purrphect/ui/tokens";

export const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const FONT = `data:font/ttf;base64,${readFileSync(
  createRequire(import.meta.url).resolve("@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf"),
).toString("base64")}`;

export const THEME = Object.entries(tokens.cssVars(tokens.light))
  .map(([k, v]) => `${k}: ${v};`)
  .join(" ");

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

export const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const px = (n: number) => `${Math.round(n * 100) / 100}px`;

export function decor(index: number, u: number, size: { width: number; height: number }) {
  const set = DECOR[index % DECOR.length] ?? DECOR[0];
  const span = Math.max(size.width, size.height);
  const blobs = set.blobs.map(([color, x, y, scale]) => {
    const d = scale * span;
    return `<div class="blob" style="left:${px(x * size.width - d / 2)};top:${px(y * size.height - d / 2)};width:${px(d)};height:${px(d)};background:hsl(var(--${color}))"></div>`;
  });
  const dots = DOTS.map(
    ([x = 0, y = 0], i) =>
      `<div class="dot" style="left:${px(x * size.width - u)};top:${px(y * size.height - u)};background:hsl(var(--${set.dots[i % set.dots.length]}))"></div>`,
  );
  return [...blobs, ...dots].join("");
}

export function fill(template: string, fills: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = fills[key];
    if (value === undefined) throw new Error(`Unknown template token ${key}`);
    return value;
  });
}
