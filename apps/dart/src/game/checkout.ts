import { isIn, meetsRule, type RingRule, type Rules } from "./rules";
import { info, SCORING_SEGMENTS, type Segment, type SegmentInfo, segmentFor } from "./segments";

export interface Route {
  darts: Segment[];
  cost: number;
}

const DOUBLE_PREFERENCE: Partial<Record<number, number>> = {
  20: 0,
  16: 1,
  8: 2,
  10: 2,
  18: 3,
  12: 3,
  4: 4,
  6: 5,
  14: 5,
  2: 6,
  25: 12,
};
const TREBLE_PREFERENCE: Partial<Record<number, number>> = {
  20: 3,
  19: 4,
  18: 5,
  17: 6,
  16: 6,
  15: 6,
  14: 7,
  13: 7,
  12: 7,
  11: 7,
  10: 7,
};

function finishCost(dart: SegmentInfo): number {
  if (dart.multiplier === 2) return DOUBLE_PREFERENCE[dart.number] ?? 8;
  if (dart.multiplier === 3) return 9;
  return dart.number === 25 ? 6 : 1;
}

function setupCost(dart: SegmentInfo): number {
  if (dart.multiplier === 3) return TREBLE_PREFERENCE[dart.number] ?? 9;
  if (dart.multiplier === 2) return 12;
  if (dart.number === 25) return 6;
  return dart.number >= 16 ? 0 : 1;
}

const finishersCache = new Map<RingRule, SegmentInfo[]>();
function finishers(out: RingRule): SegmentInfo[] {
  let list = finishersCache.get(out);
  if (!list) {
    list = SCORING_SEGMENTS.filter((d) => meetsRule(d, out));
    finishersCache.set(out, list);
  }
  return list;
}

const routeCache = new Map<string, Route[]>();

export function routes(remaining: number, dartsLeft: number, out: RingRule): Route[] {
  const key = `${remaining}:${dartsLeft}:${out}`;
  const cached = routeCache.get(key);
  if (cached) return cached;
  const result = computeRoutes(remaining, dartsLeft, out);
  routeCache.set(key, result);
  return result;
}

function computeRoutes(remaining: number, dartsLeft: number, out: RingRule): Route[] {
  if (remaining < 1 || remaining > 180 || dartsLeft < 1) return [];
  const fin = finishers(out);
  const byValue = new Map<number, SegmentInfo[]>();
  for (const f of fin) byValue.set(f.value, [...(byValue.get(f.value) ?? []), f]);
  const found: Route[] = [];

  for (const f of byValue.get(remaining) ?? []) found.push({ darts: [f.segment], cost: finishCost(f) });

  if (dartsLeft >= 2) {
    for (const a of SCORING_SEGMENTS) {
      for (const f of byValue.get(remaining - a.value) ?? []) {
        found.push({ darts: [a.segment, f.segment], cost: 100 + setupCost(a) + finishCost(f) });
      }
    }
  }

  if (dartsLeft >= 3) {
    for (let i = 0; i < SCORING_SEGMENTS.length; i++) {
      for (let j = i; j < SCORING_SEGMENTS.length; j++) {
        const a = SCORING_SEGMENTS[i];
        const b = SCORING_SEGMENTS[j];
        if (!a || !b) continue;
        const [first, second] =
          a.multiplier > b.multiplier || (a.multiplier === b.multiplier && setupCost(a) <= setupCost(b))
            ? [a, b]
            : [b, a];
        for (const f of byValue.get(remaining - a.value - b.value) ?? []) {
          found.push({
            darts: [first.segment, second.segment, f.segment],
            cost: 200 + setupCost(a) + setupCost(b) + finishCost(f),
          });
        }
      }
    }
  }

  return found.sort((x, y) => x.cost - y.cost);
}

export function bestRoute(remaining: number, dartsLeft: number, out: RingRule): Route | undefined {
  return routes(remaining, dartsLeft, out)[0];
}

export function finishRoute(rules: Rules, remaining: number, dartsLeft: number): Route | undefined {
  const all = routes(remaining, dartsLeft, rules.out);
  if (isIn(rules, remaining)) return all[0];
  for (const route of all) {
    const setups = route.darts.length === 1 ? route.darts : route.darts.slice(0, -1);
    const entry = setups.findIndex((d) => meetsRule(info(d), rules.in));
    if (entry < 0) continue;
    const darts = [...route.darts];
    const [dart] = darts.splice(entry, 1);
    return dart ? { ...route, darts: [dart, ...darts] } : undefined;
  }
  return undefined;
}

export interface SetupShot {
  aim: Segment;
  leaves: number;
}

// Only called when there is no finish in hand.
export function setupShot(remaining: number, dartsLeft: number, out: RingRule): SetupShot {
  const scoreBig: SetupShot = { aim: "T20", leaves: remaining - 60 };
  if (dartsLeft > 1 && scoreBig.leaves >= 2) return scoreBig;
  let best: (SetupShot & { cost: number }) | undefined;
  for (const d of SCORING_SEGMENTS) {
    const leaves = remaining - d.value;
    if (leaves < 2) continue;
    const next = bestRoute(leaves, 3, out);
    if (!next) continue;
    const cost = setupCost(d) + next.cost - d.value / 10;
    if (!best || cost < best.cost) best = { aim: d.segment, leaves, cost };
  }
  return best ? { aim: best.aim, leaves: best.leaves } : scoreBig;
}

export interface MissFallback {
  single: Segment;
  leaves: number;
  route: Route | undefined;
  setup: SetupShot | undefined;
}

export function missFallback(
  route: Route,
  remaining: number,
  dartsLeft: number,
  out: RingRule,
): MissFallback | undefined {
  const first = route.darts[0];
  if (!first || route.darts.length < 2) return undefined;
  const aimed = info(first);
  if (aimed.multiplier !== 3 || aimed.number === 25 || aimed.number === 0) return undefined;
  const leaves = remaining - aimed.number;
  const next = bestRoute(leaves, dartsLeft - 1, out);
  return {
    single: segmentFor(aimed.number, 1),
    leaves,
    route: next,
    setup: next ? undefined : setupShot(leaves, dartsLeft - 1, out),
  };
}
