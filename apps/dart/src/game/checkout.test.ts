import { describe, expect, it } from "vitest";
import { bestRoute, finishRoute, missFallback, setupShot } from "./checkout";
import { DEFAULT_RULES, type Rules } from "./rules";

const route = (remaining: number, darts = 3, out: "double" | "master" | "straight" = "double") =>
  bestRoute(remaining, darts, out)?.darts;

describe("checkout routes", () => {
  it("finds the standard double-out routes", () => {
    expect(route(170)).toEqual(["T20", "T20", "Bull"]);
    expect(route(100)).toEqual(["T20", "D20"]);
    expect(route(81)).toEqual(["T19", "D12"]);
    expect(route(61)).toEqual(["T15", "D8"]);
    expect(route(40)).toEqual(["D20"]);
    expect(route(32)).toEqual(["D16"]);
  });

  it("leads with the dart that gets a player in", () => {
    const doubleIn: Rules = { ...DEFAULT_RULES, start: 160, in: "double" };
    expect(finishRoute(doubleIn, 160, 3)?.darts).toEqual(["Bull", "T20", "Bull"]);
    expect(finishRoute(doubleIn, 100, 3)?.darts).toEqual(["T20", "D20"]);
  });

  it("throws the treble before the single so a miss still leaves a finish", () => {
    expect(route(120)).toEqual(["T20", "S20", "D20"]);
  });

  it("re-plans with fewer darts", () => {
    expect(route(62, 2)).toEqual(["T10", "D16"]);
    expect(route(41, 1)).toBeUndefined();
  });

  it("has no route for bogey numbers", () => {
    for (const bogey of [169, 168, 166, 165, 163, 162, 159]) expect(route(bogey)).toBeUndefined();
  });

  it("respects master and straight out", () => {
    expect(route(3, 1, "master")).toEqual(["T1"]);
    expect(route(3, 1, "double")).toBeUndefined();
    expect(route(1, 1, "straight")).toEqual(["S1"]);
    expect(route(180, 3, "straight")).toEqual(["T20", "T20", "T20"]);
  });
});

describe("setup shots", () => {
  it("scores big when there is no out this visit", () => {
    expect(setupShot(169, 3, "double")).toEqual({ aim: "T20", leaves: 109 });
  });

  it("leaves a clean double with the last dart", () => {
    expect(setupShot(41, 1, "double")).toEqual({ aim: "S1", leaves: 40 });
  });

  it("prefers scoring with the last dart when every leave needs three darts", () => {
    expect(setupShot(159, 1, "double").aim).toBe("T20");
  });
});

describe("miss fallback", () => {
  it("plans the next darts after hitting the single instead of the treble", () => {
    const r = bestRoute(81, 3, "double");
    if (!r) throw new Error("expected a route");
    const fb = missFallback(r, 81, 3, "double");
    expect(fb?.single).toBe("S19");
    expect(fb?.leaves).toBe(62);
    expect(fb?.route?.darts).toEqual(["T10", "D16"]);
  });
});
