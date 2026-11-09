import { describe, expect, it } from "vitest";
import { visitCall } from "./call";
import { DEFAULT_RULES, type Rules } from "./rules";
import type { Segment } from "./segments";
import { replay } from "./x01";

const callAfter = (darts: Segment[], r: Partial<Rules> = {}, players = 2) => {
  const rules = { ...DEFAULT_RULES, firstTo: 1, ...r };
  return visitCall(replay(rules, players, darts.slice(0, -1)), replay(rules, players, darts));
};

describe("visitCall", () => {
  it("stays quiet until the visit is over", () => {
    expect(callAfter(["T20"])).toBeNull();
    expect(callAfter(["T20", "T20"])).toBeNull();
  });

  it("calls the visit total", () => {
    expect(callAfter(["T20", "T20", "T20"])).toBe(180);
    expect(callAfter(["S20", "S1", "S5"])).toBe(26);
  });

  it("calls no score for a bust or a visit of zero", () => {
    expect(callAfter(["D19", "S1"], { start: 40 })).toBe("noScore");
    expect(callAfter(["Miss", "Miss", "Miss"])).toBe("noScore");
  });

  it("calls a checkout by its total", () => {
    expect(callAfter(["D20"], { start: 40 })).toBe(40);
  });
});
