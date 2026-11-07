import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEVICES = {
  ipad: "iPad",
  iphone: "iPhone",
  "android-tablet": "Android tablet",
  "android-phone": "Android phone",
};

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function shots(value: unknown): Shot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((e) =>
    isRecord(e) &&
    typeof e.file === "string" &&
    typeof e.caption === "string" &&
    typeof e.width === "number" &&
    typeof e.height === "number"
      ? [{ src: `/screenshots/${e.file}`, caption: e.caption, width: e.width, height: e.height }]
      : [],
  );
}

export async function loadScreenshots(): Promise<DeviceShots[]> {
  const manifestPath = path.join(DIR, "manifest.json");
  if (!existsSync(manifestPath)) return [];
  const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  const devices = isRecord(manifest) && isRecord(manifest.devices) ? manifest.devices : {};
  return Object.entries(DEVICES)
    .map(([device, label]) => ({ device, label, shots: shots(devices[device]) }))
    .filter((d) => d.shots.length > 0);
}
