import { bestRoute } from "./checkout";
import type { Rules } from "./rules";
import { BOARD_NUMBERS, type Segment, segmentFor } from "./segments";
import { replay, threeDartAverage } from "./x01";

export interface PlayedMatch {
  id: string;
  rules: Rules;
  playerIds: string[];
  segments: Segment[];
  finishedAt: number;
}

export interface Bands {
  "60+": number;
  "80+": number;
  "100+": number;
  "140+": number;
  "180": number;
}

export interface RangeRate {
  label: string;
  chances: number;
  hits: number;
}

export interface TrendPoint {
  at: number;
  average: number;
  first9Average: number;
}

export interface PlayerStats {
  matches: number;
  playedAt: number[];
  trend: TrendPoint[];
  darts: number;
  points: number;
  average: number;
  first9Average: number;
  finishAttempts: number;
  checkouts: number;
  checkoutRate: number;
  highestFinish: number;
  bigFinishes: number;
  bullFinishes: number;
  highestVisit: number;
  /** Fewest darts in a won leg of 501 or more. */
  bestLegDarts: number | null;
  legsPlayed: number;
  legsWon: number;
  bands: Bands;
  doubles: Record<string, { attempts: number; hits: number }>;
  heat: Partial<Record<Segment, number>>;
  byRange: RangeRate[];
}

const RANGES: [string, number, number][] = [
  ["2-40", 2, 40],
  ["41-80", 41, 80],
  ["81-120", 81, 120],
  ["121-170", 121, 170],
];

function targetDouble(scoreBefore: number): Segment | undefined {
  if (scoreBefore === 50) return "Bull";
  const n = BOARD_NUMBERS.find((b) => b * 2 === scoreBefore);
  return n ? segmentFor(n, 2) : undefined;
}

export function emptyStats(): PlayerStats {
  return {
    matches: 0,
    playedAt: [],
    trend: [],
    darts: 0,
    points: 0,
    average: 0,
    first9Average: 0,
    finishAttempts: 0,
    checkouts: 0,
    checkoutRate: 0,
    highestFinish: 0,
    bigFinishes: 0,
    bullFinishes: 0,
    highestVisit: 0,
    bestLegDarts: null,
    legsPlayed: 0,
    legsWon: 0,
    bands: { "60+": 0, "80+": 0, "100+": 0, "140+": 0, "180": 0 },
    doubles: {},
    heat: {},
    byRange: RANGES.map(([label]) => ({ label, chances: 0, hits: 0 })),
  };
}

export function playerStats(matches: readonly PlayedMatch[], playerId: string): PlayerStats {
  const st = emptyStats();
  let first9Points = 0;
  let first9Darts = 0;

  for (const m of [...matches].sort((a, b) => a.finishedAt - b.finishedAt)) {
    const p = m.playerIds.indexOf(playerId);
    if (p < 0) continue;
    st.matches++;
    st.playedAt.push(m.finishedAt);
    const state = replay(m.rules, m.playerIds.length, m.segments);
    const match = { points: 0, darts: 0, first9Points: 0, first9Darts: 0 };
    const visitsPerLeg = new Map<number, number>();
    const dartsPerLeg = new Map<number, number>();

    for (const v of state.visits) {
      if (v.player !== p) continue;
      const n = visitsPerLeg.get(v.leg) ?? 0;
      visitsPerLeg.set(v.leg, n + 1);
      dartsPerLeg.set(v.leg, (dartsPerLeg.get(v.leg) ?? 0) + v.darts.length);
      match.darts += v.darts.length;
      match.points += v.scored;
      if (n < 3) {
        match.first9Points += v.scored;
        match.first9Darts += v.darts.length;
      }
      if (v.scored >= 180) st.bands["180"]++;
      else if (v.scored >= 140) st.bands["140+"]++;
      else if (v.scored >= 100) st.bands["100+"]++;
      else if (v.scored >= 80) st.bands["80+"]++;
      else if (v.scored >= 60) st.bands["60+"]++;
      st.highestVisit = Math.max(st.highestVisit, v.scored);
      if (v.checkout) {
        st.checkouts++;
        st.highestFinish = Math.max(st.highestFinish, v.scored);
        if (v.scored >= 100) st.bigFinishes++;
        if (v.darts.at(-1) === "Bull") st.bullFinishes++;
      }
      const range = RANGES.findIndex(([, lo, hi]) => v.scoreBefore >= lo && v.scoreBefore <= hi);
      const bucket = st.byRange[range];
      if (bucket && bestRoute(v.scoreBefore, 3, m.rules.out)) {
        bucket.chances++;
        if (v.checkout) bucket.hits++;
      }
    }

    for (const d of state.darts) {
      if (d.player !== p) continue;
      st.heat[d.segment] = (st.heat[d.segment] ?? 0) + 1;
      if (!d.atFinish) continue;
      st.finishAttempts++;
      const target = m.rules.out === "double" ? targetDouble(d.scoreBefore) : undefined;
      if (target) {
        const entry = st.doubles[target] ?? { attempts: 0, hits: 0 };
        entry.attempts++;
        if (d.segment === target) entry.hits++;
        st.doubles[target] = entry;
      }
    }

    st.darts += match.darts;
    st.points += match.points;
    first9Points += match.first9Points;
    first9Darts += match.first9Darts;
    if (match.darts > 0) {
      st.trend.push({
        at: m.finishedAt,
        average: threeDartAverage(match.points, match.darts),
        first9Average: threeDartAverage(match.first9Points, match.first9Darts),
      });
    }

    st.legsPlayed += state.legs.length;
    for (const [i, leg] of state.legs.entries()) {
      if (leg.order[0] !== p) continue;
      st.legsWon++;
      const darts = dartsPerLeg.get(i) ?? 0;
      if (m.rules.start < 501 || darts === 0) continue;
      if (st.bestLegDarts === null || darts < st.bestLegDarts) st.bestLegDarts = darts;
    }
  }

  st.average = threeDartAverage(st.points, st.darts);
  st.first9Average = threeDartAverage(first9Points, first9Darts);
  st.checkoutRate = st.finishAttempts ? st.checkouts / st.finishAttempts : 0;
  return st;
}

export function doubleRates(stats: PlayerStats, limit = 6) {
  return Object.entries(stats.doubles)
    .sort(([, a], [, b]) => b.attempts - a.attempts)
    .slice(0, limit)
    .map(([label, d]) => ({ label, rate: d.hits / d.attempts, detail: `${d.hits}/${d.attempts}` }));
}
