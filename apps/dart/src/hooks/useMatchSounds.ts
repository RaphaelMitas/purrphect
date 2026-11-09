import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";
import type { Call } from "@/game/call";
import { useSoundEnabled } from "@/hooks/useSoundSettings";
import { CALL_CLIPS } from "@/lib/callerClips";
import knock1 from "../../assets/sounds/knock-1.mp3";
import knock2 from "../../assets/sounds/knock-2.mp3";

const KNOCK_VOLUME = 0.5;
// lets the knock land before the caller starts talking
const CALL_DELAY_MS = 250;

export function useMatchSounds() {
  const knockA = useAudioPlayer(knock1);
  const knockB = useAudioPlayer(knock2);
  const caller = useAudioPlayer(null);
  const knockOn = useSoundEnabled("knock");
  const callerOn = useSoundEnabled("caller");
  const knocks = useRef(0);
  const pendingCall = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(console.error);
    return () => clearTimeout(pendingCall.current);
  }, []);

  const dart = (call: Call | null) => {
    if (knockOn) {
      const knock = knocks.current++ % 2 === 0 ? knockA : knockB;
      knock.volume = KNOCK_VOLUME;
      void knock.seekTo(0);
      knock.play();
    }
    const clip = call !== null && callerOn ? CALL_CLIPS[call] : undefined;
    if (clip === undefined) return;
    clearTimeout(pendingCall.current);
    pendingCall.current = setTimeout(() => {
      caller.replace(clip);
      caller.play();
    }, CALL_DELAY_MS);
  };

  const cancelCall = () => {
    clearTimeout(pendingCall.current);
    caller.pause();
  };

  return { dart, cancelCall };
}
