import { describe, expect, it } from "vitest";
import { planOrder, withRing } from "./predict";
import { info, type Segment } from "./segments";

describe("plan order", () => {
  it("labels every dart on a number with its own ring", () => {
    const plan: Segment[] = ["T20", "D20"];
    const onTwenty = (s: Segment) => info(s).number === 20;
    expect(planOrder(plan, onTwenty)).toBe("1·2");
    expect(planOrder(plan, onTwenty, withRing)).toBe("1T·2D");
    expect(planOrder(["S20", "D20"], onTwenty, withRing)).toBe("1·2D");
  });
});
