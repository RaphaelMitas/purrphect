import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, type Rules } from "./rules";
import type { Segment } from "./segments";
import { replay, upNext } from "./x01";

const rules = (r: Partial<Rules> = {}): Rules => ({ ...DEFAULT_RULES, firstTo: 1, ...r });
const miss3: Segment[] = ["Miss", "Miss", "Miss"];
const max: Segment[] = ["T20", "T20", "T20"];
const nineDarter: Segment[] = [...max, ...miss3, ...max, ...miss3, "T20", "T19", "D12"];

describe("x01 engine", () => {
  it("tracks remaining and rotates players after three darts", () => {
    const s = replay(rules(), 2, max);
    expect(s.remaining).toEqual([321, 501]);
    expect(s.current).toBe(1);
    expect(s.lastEvent).toEqual({ kind: "180", player: 0 });
  });

  it("busts below zero, on one, and on a non-double finish", () => {
    const start40 = rules({ start: 40 });
    expect(replay(start40, 2, ["S20", "S20"]).remaining).toEqual([40, 40]);
    expect(replay(start40, 2, ["D19", "S1"]).lastEvent).toEqual({ kind: "bust", player: 0 });
    expect(replay(start40, 2, ["T20"]).current).toBe(1);
    expect(replay(rules({ start: 40, out: "straight" }), 2, ["S20", "S20"]).winner).toBe(0);
  });

  it("wins the leg and the match on a double", () => {
    const s = replay(rules(), 2, nineDarter);
    expect(s.winner).toBe(0);
    expect(s.legs).toEqual([{ order: [0, 1], starter: 0 }]);
    expect(s.visits.at(-1)).toMatchObject({ checkout: true, scored: 141 });
  });

  it("rotates the starting player between legs", () => {
    const s = replay(rules({ firstTo: 2 }), 2, nineDarter);
    expect(s.winner).toBeNull();
    expect(s.leg).toBe(1);
    expect(s.legStarter).toBe(1);
    expect(s.current).toBe(1);
    expect(s.remaining).toEqual([501, 501]);
  });

  it("plays out places until one player is left", () => {
    const r = rules({ start: 40, finish: "places" });
    const s1 = replay(r, 3, ["D20"]);
    expect(s1.lastEvent).toEqual({ kind: "checkout", player: 0, place: 1 });
    expect(s1.current).toBe(1);
    expect(upNext(s1)).toEqual([2]);
    const s2 = replay(r, 3, ["D20", ...miss3, "D20"]);
    expect(s2.winner).toBe(0);
    expect(s2.legs[0]?.order).toEqual([0, 2, 1]);
  });

  it("ignores darts after the match is won", () => {
    const s = replay(rules({ start: 40 }), 2, ["D20", "T20"]);
    expect(s.darts).toHaveLength(1);
  });
});
