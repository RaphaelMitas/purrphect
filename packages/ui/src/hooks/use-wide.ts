import { useWindowDimensions } from "react-native";

export function useTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= 600;
}

export function useWide(): boolean {
  const { width, height } = useWindowDimensions();
  return width > height || Math.min(width, height) >= 600;
}
