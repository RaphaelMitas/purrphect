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

function entries(value: unknown): { file: string; caption: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((e) =>
    isRecord(e) && typeof e.file === "string" && typeof e.caption === "string"
      ? [{ file: e.file, caption: e.caption }]
      : [],
  );
}

async function pngSize(file: string) {
  const png = await readFile(file);
  if (png.toString("latin1", 12, 16) !== "IHDR") throw new Error(`${file} is not a PNG`);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

export async function loadScreenshots(): Promise<DeviceShots[]> {
  const manifestPath = path.join(DIR, "manifest.json");
  if (!existsSync(manifestPath)) return [];
  const manifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  const devices = isRecord(manifest) && isRecord(manifest.devices) ? manifest.devices : {};
  const all = await Promise.all(
    Object.entries(DEVICES).map(async ([device, label]) => ({
      device,
      label,
      shots: await Promise.all(
        entries(devices[device]).map(async ({ file, caption }) => ({
          src: `/screenshots/${file}`,
          caption,
          ...(await pngSize(path.join(DIR, file))),
        })),
      ),
    })),
  );
  return all.filter((d) => d.shots.length > 0);
}
