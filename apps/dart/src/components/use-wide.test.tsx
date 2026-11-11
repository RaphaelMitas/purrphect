import { describe, expect, it } from "@jest/globals";
import { useShort, useWide } from "@purrphect/ui/hooks/use-wide";
import { renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";

const WINDOWS = [
  { name: "iPhone Duo, closed", width: 466, height: 678, wide: false, short: true },
  { name: "iPhone Duo, unfolded upright", width: 669, height: 951, wide: false, short: false },
  { name: "iPhone Duo, unfolded wide", width: 951, height: 669, wide: true, short: true },
  { name: "iPhone", width: 440, height: 956, wide: false, short: false },
  { name: "iPad mini, portrait", width: 744, height: 1133, wide: true, short: false },
];

describe("window layout", () => {
  it.each(WINDOWS)("$name", async ({ width, height, wide, short }) => {
    const size = { width, height, scale: 3, fontScale: 1 };
    Dimensions.set({ window: size, screen: size });
    const { result } = await renderHook(() => ({ wide: useWide(), short: useShort() }));
    expect(result.current).toEqual({ wide, short });
  });
});
