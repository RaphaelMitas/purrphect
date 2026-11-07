import { describe, expect, it } from "vitest";
import { progressFor } from "./levels";
import { DEFAULT_RULES } from "./rules";
import type { Segment } from "./segments";
import { type PlayedMatch, playerStats } from "./stats";

const visit = (...darts: Segment[]) => darts;
const segments: Segment[] = [
  ...visit("T20", "T20", "T20"),
  ...visit("S1", "S1", "S1"),
  ...visit("T20", "T20", "T20"),
  ...visit("S1", "S1", "S1"),
  ...visit("T20", "T19", "D12"),
];
const match: PlayedMatch = {
  id: "m1",
  rules: { ...DEFAULT_RULES, firstTo: 1 },
  playerIds: ["ruffy", "lou"],
  segments,
  finishedAt: Date.UTC(2026, 10, 7, 20),
};

describe("player stats", () => {
  it("computes averages, bands and finishes from darts", () => {
    const s = playerStats([match], "ruffy");
    expect(s.darts).toBe(9);
    expect(s.average).toBeCloseTo(167);
    expect(s.bands["180"]).toBe(2);
    expect(s.highestFinish).toBe(141);
    expect(s.legsWon).toBe(1);
    expect(s.bestLegDarts).toBe(9);
  });

  it("counts darts at a finish and per-double hits", () => {
    const s = playerStats([match], "ruffy");
    expect(s.finishAttempts).toBe(1);
    expect(s.checkouts).toBe(1);
    expect(s.doubles.D12).toEqual({ attempts: 1, hits: 1 });
    expect(s.byRange.find((r) => r.label === "121-170")).toEqual({ label: "121-170", chances: 1, hits: 1 });
  });

  it("ignores players who did not play", () => {
    expect(playerStats([match], "mia").matches).toBe(0);
  });
});

describe("levels", () => {
  it("awards xp and badges", () => {
    const p = progressFor(playerStats([match], "ruffy"));
    expect(p.counts).toMatchObject({ legPlayed: 1, legWon: 1, oneEighty: 2, bigFinish: 1 });
    expect(p.xp).toBe(20 + 50 + 200 + 80 + 10);
    expect(p.badges).toEqual(expect.arrayContaining(["first180", "bigFinish", "fifteenDarter"]));
    expect(p.levelKey).toBe("yarnChaser");
  });
});
