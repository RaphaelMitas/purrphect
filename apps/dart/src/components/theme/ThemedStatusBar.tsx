import { usePalette } from "@purrphect/ui/lib/theme";
import { Stack } from "expo-router";

// The native stack owns the iOS status bar, so expo-status-bar is ignored.
export function ThemedStatusBar() {
  const { dark } = usePalette();
  return <Stack.Screen options={{ statusBarStyle: dark ? "light" : "dark" }} />;
}
