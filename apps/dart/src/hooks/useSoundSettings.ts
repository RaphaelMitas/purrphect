import { useSyncExternalStore } from "react";
import { storedState } from "@/lib/storedState";

export type SoundKind = "knock" | "caller";

const enabledUnlessOff = (raw: string | null) => raw !== "false";
const stores = {
  knock: storedState("sound.knock", enabledUnlessOff),
  caller: storedState("sound.caller", enabledUnlessOff),
};

export function useSoundEnabled(kind: SoundKind): boolean {
  const store = stores[kind];
  return useSyncExternalStore(store.subscribe, store.read);
}

export function setSoundEnabled(kind: SoundKind, enabled: boolean) {
  stores[kind].update(() => enabled);
}
