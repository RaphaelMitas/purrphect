import type { SegmentInfo } from "./segments";

export type RingRule = "double" | "master" | "straight";
export type GetInRule = Exclude<RingRule, "straight">;
export type FinishMode = "leg" | "places";

export interface Rules {
  start: number;
  in: RingRule;
  out: RingRule;
  firstTo: number;
  finish: FinishMode;
  randomOrder: boolean;
}

export const DEFAULT_RULES: Rules = {
  start: 501,
  in: "straight",
  out: "double",
  firstTo: 3,
  finish: "leg",
  randomOrder: false,
};

export function meetsRule(dart: SegmentInfo, rule: RingRule): boolean {
  if (dart.multiplier === 0) return false;
  if (rule === "straight") return true;
  if (rule === "master") return dart.multiplier >= 2;
  return dart.multiplier === 2;
}

// A bust in the visit that got the player in resets them to the start, which puts them back out.
export function isIn(rules: Rules, remaining: number): boolean {
  return rules.in === "straight" || remaining !== rules.start;
}

export function isBust(remainingAfter: number, dart: SegmentInfo, out: RingRule): boolean {
  if (remainingAfter < 0) return true;
  if (out !== "straight" && remainingAfter === 1) return true;
  return remainingAfter === 0 && !meetsRule(dart, out);
}
