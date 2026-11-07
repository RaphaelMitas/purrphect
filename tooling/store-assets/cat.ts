import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SOURCES = ["cat-paths.ts", "cat.tsx"].map((f) =>
  fileURLToPath(new URL(`../../packages/ui/src/${f}`, import.meta.url)),
);
const DETAIL = "#FFFFFF";
const BLUSH = "#FFB3CD";

// Read from the app's source so the store cat can never drift from the one in the app.
function readPaths() {
  const file = SOURCES.find((f) => existsSync(f));
  if (!file) throw new Error("No cat source in packages/ui/src");
  const source = readFileSync(file, "utf8");
  const constant = (name: string) => {
    const value = new RegExp(`${name}\\s*=\\s*"([^"]+)"`).exec(source)?.[1];
    if (!value) throw new Error(`${name} not found in ${file}`);
    return value;
  };
  const block = /WHISKERS[^=]*=\s*\[([\s\S]*?)\n\]/.exec(source)?.[1] ?? "";
  const whiskers = [...block.matchAll(/d:\s*"([^"]+)"(?:,\s*transform:\s*(?:"([^"]*)"|undefined))?/g)].map((m) => ({
    d: m[1] ?? "",
    transform: m[2],
  }));
  if (whiskers.length === 0) throw new Error(`WHISKERS not found in ${file}`);
  return { whiskers, head: constant("HEAD"), nose: constant("NOSE") };
}

const paths = readPaths();

export function catSvg(color: string): string {
  const whiskers = paths.whiskers
    .map((w) => `<path d="${w.d}" fill="${color}"${w.transform ? ` transform="${w.transform}"` : ""}/>`)
    .join("");
  const eye = (x: number) =>
    `<g transform="translate(${x}, 79.4965)"><ellipse cx="14.5" cy="13.5" rx="14.5" ry="13.5" fill="${DETAIL}"/><circle cx="18.5" cy="12.5" r="3.5" fill="${color}"/></g>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 229 255">`,
    `<g transform="translate(176.411, 116.7557)">${whiskers}</g>`,
    `<g transform="translate(26, 136.4965) scale(-1, 1) translate(-26, -136.4965) translate(0, 117.4965)">${whiskers}</g>`,
    `<path d="${paths.head}" fill="${color}" transform="translate(111.8505, 127.0969) scale(1, -1) translate(-111.8505, -127.0969)"/>`,
    `<ellipse cx="72" cy="122" rx="12" ry="7" fill="${BLUSH}" opacity="0.8"/>`,
    `<ellipse cx="160" cy="122" rx="12" ry="7" fill="${BLUSH}" opacity="0.8"/>`,
    eye(130),
    eye(73),
    `<path d="${paths.nose}" fill="${DETAIL}"/>`,
    "</svg>",
  ].join("");
}
