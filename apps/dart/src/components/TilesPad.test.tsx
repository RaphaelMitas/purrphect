import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import type { Segment } from "@/game/segments";
import { TilesPad } from "./TilesPad";

async function renderPad(plan: readonly Segment[] = []) {
  const onDart = jest.fn<(segment: Segment) => void>();
  await render(<TilesPad plan={plan} onDart={onDart} onUndo={() => {}} />);
  return onDart;
}

const key = (name: string) => screen.getByRole("button", { name });

describe("TilesPad", () => {
  it("arms Triple for one dart, then falls back to singles", async () => {
    const user = userEvent.setup();
    const onDart = await renderPad();

    await user.press(key("Triple"));
    await user.press(key("T19"));
    await user.press(key("19"));

    expect(onDart.mock.calls).toEqual([["T19"], ["S19"]]);
  });

  it("disarms when the armed multiplier is pressed again", async () => {
    const user = userEvent.setup();
    const onDart = await renderPad();

    await user.press(key("Double"));
    await user.press(key("Triple"));
    await user.press(key("Triple"));
    await user.press(key("5"));

    expect(onDart.mock.calls).toEqual([["S5"]]);
  });

  it("names the ring of every planned dart on its number tile", async () => {
    await renderPad(["T20", "D20"]);

    expect(within(key("20")).getByText("1T·2D")).toBeOnTheScreen();
  });
});
