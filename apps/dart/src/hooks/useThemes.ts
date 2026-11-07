import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { parseThemeState, type ThemeState } from "@/lib/themes";

const KEY = "themes";
const listeners = new Set<() => void>();
let state: ThemeState | undefined;

const read = () => {
  state ??= parseThemeState(Storage.getItemSync(KEY));
  return state;
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function updateThemes(change: (state: ThemeState) => ThemeState) {
  state = change(read());
  Storage.setItemSync(KEY, JSON.stringify(state));
  for (const listener of listeners) listener();
}

export function useThemes(): ThemeState {
  return useSyncExternalStore(subscribe, read);
}
