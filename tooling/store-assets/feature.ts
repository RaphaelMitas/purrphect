import { readdirSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { catSvg } from "@purrphect/ui/cat-svg";
import { chromium } from "playwright";
import { decor, escapeHtml, FONT, fill, here, THEME } from "./rig.ts";

const SIZE = { width: 1024, height: 500 };

const [outArg] = process.argv.slice(2);
if (!outArg) {
  console.error("Usage: node feature.ts <out-dir>");
  process.exit(1);
}
const outDir = resolve(outArg);
const storeDir = here("../../apps/dart/store");
const template = readFileSync(here("feature.html"), "utf8");
const text = (locale: string, file: string) => readFileSync(join(storeDir, locale, file), "utf8").trim();

const locales = readdirSync(storeDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: SIZE });
  for (const locale of locales) {
    const html = fill(template, {
      THEME,
      FONT,
      DECOR: decor(0, 5, SIZE),
      NAME: escapeHtml(text(locale, "name.txt")),
      SUBTITLE: escapeHtml(text(locale, "subtitle.txt")),
      CAT: catSvg("#FF6FA3"),
    });
    await page.setContent(html, { waitUntil: "load" });
    const overflows = await page.evaluate(async () => {
      await document.fonts.ready;
      const main = document.querySelector("main");
      const cat = document.querySelector(".cat")?.getBoundingClientRect();
      if (!main || !cat) return true;
      return [...main.children].some((el) => {
        const box = el.getBoundingClientRect();
        return el.scrollWidth > el.clientWidth || box.right > cat.left;
      });
    });
    if (overflows) throw new Error(`The ${locale} feature graphic text does not fit`);
    const file = join(outDir, locale, "featureGraphic.png");
    await mkdir(join(outDir, locale), { recursive: true });
    await page.screenshot({ path: file });
    console.log(file);
  }
} finally {
  await browser.close();
}
