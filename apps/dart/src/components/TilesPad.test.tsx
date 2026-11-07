import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import type { Segment } from "@/game/segments";
import { TilesPad } from "./TilesPad";

async function renderPad(direct: boolean, plan: readonly Segment[] = []) {
  const onDart = jest.fn<(segment: Segment) => void>();
  await render(<TilesPad direct={direct} plan={plan} onDart={onDart} onUndo={() => {}} />);
  return onDart;
}

const key = (name: string) => screen.getByRole("button", { name });

describe("TilesPad", () => {
  it("throws doubles and trebles straight from a tablet tile", async () => {
    const user = userEvent.setup();
    const onDart = await renderPad(true);

    await user.press(key("D20"));
    await user.press(key("T20"));
    await user.press(key("20"));

    expect(onDart.mock.calls).toEqual([["D20"], ["T20"], ["S20"]]);
  });

  it("arms Triple for one dart, then falls back to singles", async () => {
    const user = userEvent.setup();
    const onDart = await renderPad(false);

    await user.press(key("Triple"));
    await user.press(key("T19"));
    await user.press(key("19"));

    expect(onDart.mock.calls).toEqual([["T19"], ["S19"]]);
  });

  it("disarms when the armed multiplier is pressed again", async () => {
    const user = userEvent.setup();
    const onDart = await renderPad(false);

    await user.press(key("Double"));
    await user.press(key("Triple"));
    await user.press(key("Triple"));
    await user.press(key("5"));

    expect(onDart.mock.calls).toEqual([["S5"]]);
  });

  it("names the ring of every planned dart on a phone tile", async () => {
    await renderPad(false, ["T20", "D20"]);

    expect(within(key("20")).getByText("1T·2D")).toBeOnTheScreen();
  });

  it("puts plan badges on the exact key on a tablet tile", async () => {
    await renderPad(true, ["T20", "S5", "D20"]);

    expect(within(key("T20")).getByText("1")).toBeOnTheScreen();
    expect(within(key("5")).getByText("2")).toBeOnTheScreen();
    expect(within(key("D20")).getByText("3")).toBeOnTheScreen();
  });
});
