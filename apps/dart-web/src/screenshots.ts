import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type Device, parseManifest } from "@purrphect/store-assets/manifest";

const GALLERY: [Device, string][] = [
  ["ipad", "iPad"],
  ["iphone", "iPhone"],
  ["android-tablet", "Android tablet"],
  ["android-phone", "Android phone"],
];

export interface Shot {
  src: string;
  caption: string;
  width: number;
  height: number;
}

export interface DeviceShots {
  device: string;
  label: string;
  shots: Shot[];
}

const DIR = path.join(process.cwd(), "public", "screenshots");

export async function loadScreenshots(): Promise<DeviceShots[]> {
  const manifestPath = path.join(DIR, "manifest.json");
  if (!existsSync(manifestPath)) return [];
  const { devices } = parseManifest(JSON.parse(await readFile(manifestPath, "utf8")));
  return GALLERY.flatMap(([device, label]) => {
    const entries = devices[device] ?? [];
    return entries.length
      ? [{ device, label, shots: entries.map((e) => ({ src: `/screenshots/${e.file}`, ...e })) }]
      : [];
  });
}
