import { useSyncExternalStore } from "react";
import { storedState } from "@/lib/storedState";

const enabledUnlessOff = (raw: string | null) => raw !== "false";
const stores = {
  knock: storedState("sound.knock", enabledUnlessOff),
  caller: storedState("sound.caller", enabledUnlessOff),
};

export type SoundKind = keyof typeof stores;

export function useSoundEnabled(kind: SoundKind): boolean {
  const store = stores[kind];
  return useSyncExternalStore(store.subscribe, store.read);
}

export function setSoundEnabled(kind: SoundKind, enabled: boolean) {
  stores[kind].update(() => enabled);
}
