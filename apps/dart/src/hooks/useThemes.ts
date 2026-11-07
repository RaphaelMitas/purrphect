import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { useColorScheme } from "react-native";
import { parseThemeState, type Slot, type ThemeState } from "@/lib/themes";

const KEY = "themes";
const listeners = new Set<() => void>();
let state: ThemeState | undefined;

function stored(): string | null {
  try {
    return Storage.getItemSync(KEY);
  } catch {
    return null;
  }
}

const read = () => {
  state ??= parseThemeState(stored());
  return state;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function updateThemes(change: (state: ThemeState) => ThemeState) {
  const next = change(read());
  try {
    Storage.setItemSync(KEY, JSON.stringify(next));
  } catch (error) {
    console.error(error);
  }
  state = next;
  for (const listener of listeners) listener();
}

export function useThemes(): ThemeState {
  return useSyncExternalStore(subscribe, read);
}

export function useSystemSlot(): Slot {
  return useColorScheme() === "dark" ? "dark" : "light";
}
