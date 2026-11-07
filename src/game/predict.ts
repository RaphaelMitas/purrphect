import { bestRoute, type MissFallback, missFallback, type Route, type SetupShot, setupShot } from "./checkout";
import { info, type Segment } from "./segments";
import { type MatchState, upNext } from "./x01";

export interface HitRates {
  single: number;
  double: number;
  treble: number;
  outerBull: number;
  bull: number;
}

export const DEFAULT_HIT_RATES: HitRates = { single: 0.85, double: 0.33, treble: 0.38, outerBull: 0.4, bull: 0.22 };

function hitRate(segment: Segment, rates: HitRates): number {
  if (segment === "Bull") return rates.bull;
  if (segment === "25") return rates.outerBull;
  const m = info(segment).multiplier;
  return m === 3 ? rates.treble : m === 2 ? rates.double : rates.single;
}

export function finishChance(route: Route, dartsLeft: number, rates: HitRates): number {
  const setups = route.darts.slice(0, -1);
  const finish = route.darts.at(-1);
  if (!finish) return 0;
  const tries = dartsLeft - setups.length;
  const reach = setups.reduce((p, d) => p * hitRate(d, rates), 1);
  return reach * (1 - (1 - hitRate(finish, rates)) ** tries);
}

export interface Suggestion {
  remaining: number;
  dartsLeft: number;
  route: Route | undefined;
  plan: Segment[];
  chance: number;
  fallback: MissFallback | undefined;
  setup: SetupShot | undefined;
  onFinish: number[];
}

export function suggest(s: MatchState, rates: HitRates = DEFAULT_HIT_RATES): Suggestion {
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
    chance: route ? finishChance(route, dartsLeft, rates) : 0,
    fallback: route ? missFallback(route, remaining, dartsLeft, s.rules.out) : undefined,
    setup,
    onFinish: upNext(s).filter((p) => bestRoute(s.remaining[p] ?? Infinity, 3, s.rules.out)),
  };
}
