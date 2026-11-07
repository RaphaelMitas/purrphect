import { describe, expect, it } from "vitest";
import { parseRules } from "@/db/parse";
import { shuffled } from "./shuffle";

describe("random throwing order", () => {
  it("shuffles a copy and keeps every player", () => {
    const players = ["a", "b", "c", "d"];
    const result = shuffled(players, () => 0);
    expect(result).toEqual(["b", "c", "d", "a"]);
    expect(players).toEqual(["a", "b", "c", "d"]);
  });

  it("reads matches saved before the option existed as a fixed order", () => {
    expect(parseRules('{"start":501,"out":"double","firstTo":3,"finish":"leg"}').randomOrder).toBe(false);
  });
});
