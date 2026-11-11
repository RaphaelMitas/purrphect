export const DEVICE_NAMES = ["iphone", "iphone-duo", "ipad", "android-phone", "android-tablet"] as const;
export type Device = (typeof DEVICE_NAMES)[number];

export interface Entry {
  file: string;
  caption: string;
  width: number;
  height: number;
}

export interface Manifest {
  devices: Partial<Record<Device, Entry[]>>;
}

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const isEntry = (v: unknown): v is Entry =>
  isRecord(v) &&
  typeof v.file === "string" &&
  typeof v.caption === "string" &&
  typeof v.width === "number" &&
  typeof v.height === "number";

export function parseManifest(value: unknown): Manifest {
  const manifest: Manifest = { devices: {} };
  if (!isRecord(value) || !isRecord(value.devices)) return manifest;
  for (const device of DEVICE_NAMES) {
    const entries = value.devices[device];
    if (Array.isArray(entries) && entries.every(isEntry)) manifest.devices[device] = entries;
  }
  return manifest;
}
