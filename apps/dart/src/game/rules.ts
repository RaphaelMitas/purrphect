import type { SegmentInfo } from "./segments";

export type OutRule = "double" | "master" | "straight";
export type FinishMode = "leg" | "places";

export interface Rules {
  start: number;
  out: OutRule;
  firstTo: number;
  finish: FinishMode;
}

export const DEFAULT_RULES: Rules = { start: 501, out: "double", firstTo: 3, finish: "leg" };

export function canFinishWith(dart: SegmentInfo, out: OutRule): boolean {
  if (dart.multiplier === 0) return false;
  if (out === "straight") return true;
  if (out === "master") return dart.multiplier >= 2;
  return dart.multiplier === 2;
}

export function isBust(remainingAfter: number, dart: SegmentInfo, out: OutRule): boolean {
  if (remainingAfter < 0) return true;
  if (out !== "straight" && remainingAfter === 1) return true;
  return remainingAfter === 0 && !canFinishWith(dart, out);
}
