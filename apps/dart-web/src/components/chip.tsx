import type { ReactNode } from "react";

const TONES = {
  treble: "border-pink/40 bg-pink-soft text-pink-ink",
  double: "border-mint/50 bg-mint-soft text-mint-ink",
  bull: "border-butter/60 bg-butter-soft text-butter-ink",
};

export function Chip({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-9 min-w-11 items-center justify-center rounded-xl border-2 px-2 font-extrabold text-lg ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
