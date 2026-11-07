import { describe, expect, it } from "vitest";
import { hitTest, segmentCenter } from "./board";
import type { Segment } from "./segments";

describe("board hit test", () => {
  it("maps finger positions to segments", () => {
    expect(hitTest(0, 0)).toBe("Bull");
    expect(hitTest(0, -20)).toBe("25");
    expect(hitTest(0, -115)).toBe("T20");
    expect(hitTest(0, -185)).toBe("D20");
    expect(hitTest(0, -60)).toBe("S20");
    expect(hitTest(0, -215)).toBe("Miss");
    expect(hitTest(115, 0)).toBe("T6");
    expect(hitTest(0, 185)).toBe("D3");
  });

  it("round-trips segment centers", () => {
    const segments: Segment[] = ["T19", "D12", "S5", "D16", "25", "Bull"];
    for (const s of segments) expect(hitTest(...segmentCenter(s))).toBe(s);
  });
});
