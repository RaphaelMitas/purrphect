import { usePalette } from "@purrphect/ui/lib/theme";
import { Stack } from "expo-router";

export function ThemedStatusBar() {
  const { dark } = usePalette();
  return <Stack.Screen options={{ statusBarStyle: dark ? "light" : "dark" }} />;
}
