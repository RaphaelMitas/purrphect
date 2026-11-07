import { bestRoute, type MissFallback, missFallback, type Route, type SetupShot, setupShot } from "./checkout";
import { info, type Segment } from "./segments";
import type { MatchState } from "./x01";

const HIT_RATES = { single: 0.85, double: 0.33, treble: 0.38, outerBull: 0.4, bull: 0.22 };

function hitRate(segment: Segment): number {
  if (segment === "Bull") return HIT_RATES.bull;
  if (segment === "25") return HIT_RATES.outerBull;
  const m = info(segment).multiplier;
  return m === 3 ? HIT_RATES.treble : m === 2 ? HIT_RATES.double : HIT_RATES.single;
}

export function finishChance(route: Route, dartsLeft: number): number {
  const setups = route.darts.slice(0, -1);
  const finish = route.darts.at(-1);
  if (!finish) return 0;
  const tries = dartsLeft - setups.length;
  const reach = setups.reduce((p, d) => p * hitRate(d), 1);
  return reach * (1 - (1 - hitRate(finish)) ** tries);
}

export interface Suggestion {
  remaining: number;
  dartsLeft: number;
  route: Route | undefined;
  plan: Segment[];
  chance: number;
  fallback: MissFallback | undefined;
  setup: SetupShot | undefined;
}

export function suggest(s: MatchState): Suggestion {
  const remaining = s.remaining[s.current] ?? s.rules.start;
  const dartsLeft = 3 - s.visit.length;
  const playing = s.winner === null;
  const route = playing ? bestRoute(remaining, dartsLeft, s.rules.out) : undefined;
  const setup = playing && !route ? setupShot(remaining, dartsLeft, s.rules.out) : undefined;
  return {
    remaining,
    dartsLeft,
    route,
    plan: route?.darts ?? (setup ? [setup.aim] : []),
    chance: route ? finishChance(route, dartsLeft) : 0,
    fallback: route ? missFallback(route, remaining, dartsLeft, s.rules.out) : undefined,
    setup,
  };
}

export function planOrder(plan: readonly Segment[], matches: (segment: Segment) => boolean): string {
  return plan.flatMap((s, i) => (matches(s) ? [i + 1] : [])).join("·");
}
