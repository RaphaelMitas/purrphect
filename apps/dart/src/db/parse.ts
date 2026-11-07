import type { FinishMode, OutRule, Rules } from "@/game/rules";
import { isSegment, type Segment } from "@/game/segments";

const OUT_RULES: readonly OutRule[] = ["double", "master", "straight"];
const FINISH_MODES: readonly FinishMode[] = ["leg", "places"];

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isPositiveInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

export function parseRules(json: string): Rules {
  const v: unknown = JSON.parse(json);
  if (!isRecord(v)) throw new Error("Invalid rules");
  const out = OUT_RULES.find((o) => o === v.out);
  const finish = FINISH_MODES.find((f) => f === v.finish);
  if (!isPositiveInt(v.start) || !isPositiveInt(v.firstTo) || !out || !finish) throw new Error("Invalid rules");
  return { start: v.start, firstTo: v.firstTo, out, finish, randomOrder: v.randomOrder === true };
}

export function parseIds(json: string): string[] {
  const v: unknown = JSON.parse(json);
  if (!Array.isArray(v) || !v.every((x): x is string => typeof x === "string")) throw new Error("Invalid player ids");
  return v;
}

export function parseSegment(value: string): Segment {
  if (!isSegment(value)) throw new Error(`Invalid segment ${value}`);
  return value;
}
