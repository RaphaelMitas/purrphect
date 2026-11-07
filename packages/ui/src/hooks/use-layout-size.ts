import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";

export function useLayoutSize(): [{ width: number; height: number }, (e: LayoutChangeEvent) => void] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return [size, (e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })];
}
