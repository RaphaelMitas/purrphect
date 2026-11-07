import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { Segment } from "@/game/segments";
import { DartBoard } from "./DartBoard";

const SIZE = 232;
const CENTER = SIZE / 2;

async function renderBoard() {
  const onDart = jest.fn<(segment: Segment) => void>();
  await render(<DartBoard size={SIZE} onDart={onDart} />);
  const board = screen.root;
  if (!board) throw new Error("DartBoard rendered nothing");
  const touch = (dy: number) => ({ nativeEvent: { locationX: CENTER, locationY: CENTER + dy } });
  return { onDart, board, touch };
}

describe("DartBoard touch", () => {
  it("scores the segment under the finger on release, scaled to the board size", async () => {
    const { onDart, board, touch } = await renderBoard();

    await fireEvent(board, "responderGrant", touch(-57.5));
    expect(onDart).not.toHaveBeenCalled();
    await fireEvent(board, "responderRelease");

    expect(onDart.mock.calls).toEqual([["T20"]]);
  });

  it("scores where the finger lifts after sliding", async () => {
    const { onDart, board, touch } = await renderBoard();

    await fireEvent(board, "responderGrant", touch(-57.5));
    await fireEvent(board, "responderMove", touch(-92.5));
    await fireEvent(board, "responderRelease");

    expect(onDart.mock.calls).toEqual([["D20"]]);
  });

  it("throws nothing when the finger lifts off the board or the touch is taken away", async () => {
    const { onDart, board, touch } = await renderBoard();

    await fireEvent(board, "responderGrant", touch(-57.5));
    await fireEvent(board, "responderMove", touch(-110));
    await fireEvent(board, "responderRelease");
    await fireEvent(board, "responderGrant", touch(0));
    await fireEvent(board, "responderTerminate");

    expect(onDart).not.toHaveBeenCalled();
  });
});
