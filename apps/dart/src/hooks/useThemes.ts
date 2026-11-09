import { useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";
import { storedState } from "@/lib/storedState";
import { parseThemeState, type Slot, type ThemeState } from "@/lib/themes";

const themes = storedState("themes", parseThemeState);

export const updateThemes = themes.update;

export function useThemes(): ThemeState {
  return useSyncExternalStore(themes.subscribe, themes.read);
}

export function useSystemSlot(): Slot {
  return useColorScheme() === "dark" ? "dark" : "light";
}
