import type { PlayedMatch } from "./stats";
import { replay } from "./x01";

export const LEVELS = [
  { name: "Kitten", xp: 0 },
  { name: "Yarn Chaser", xp: 150 },
  { name: "Alley Cat", xp: 400 },
  { name: "House Panther", xp: 750 },
  { name: "Tomcat", xp: 1200 },
  { name: "Whisker Wizard", xp: 1750 },
  { name: "Purrfessional", xp: 2300 },
  { name: "Top Cat", xp: 3000 },
  { name: "Lionheart", xp: 4500 },
  { name: "Purrphect", xp: 6500 },
] as const;

export const XP_RULES = [
  { key: "legPlayed", label: "Leg played", xp: 20 },
  { key: "legWon", label: "Leg won", xp: 50 },
  { key: "ton", label: "100+ visit", xp: 10 },
  { key: "oneEighty", label: "180", xp: 100 },
  { key: "bigFinish", label: "100+ finish", xp: 80 },
  { key: "streakDay", label: "Daily streak", xp: 30 },
] as const;

type XpKey = (typeof XP_RULES)[number]["key"];

export type BadgeKey = "first180" | "bigFinish" | "bullFinish" | "streak5" | "fifteenDarter";

export const BADGES: Record<BadgeKey, string> = {
  first180: "First 180",
  bigFinish: "100+ finish",
  bullFinish: "Bull finish",
  streak5: "5 day streak",
  fifteenDarter: "15 darter",
};

export interface Progress {
  xp: number;
  counts: Record<XpKey, number>;
  level: number;
  name: string;
  levelXp: number;
  nextXp: number | null;
  nextName: string | null;
  badges: BadgeKey[];
  bestStreak: number;
}

const DAY = 24 * 60 * 60 * 1000;
const dayIndex = (at: number) => Math.floor((at - new Date(at).getTimezoneOffset() * 60 * 1000) / DAY);

export function progressFor(matches: readonly PlayedMatch[], playerId: string): Progress {
  const counts: Record<XpKey, number> = { legPlayed: 0, legWon: 0, ton: 0, oneEighty: 0, bigFinish: 0, streakDay: 0 };
  const badges = new Set<BadgeKey>();
  const days = new Set<number>();

  for (const m of matches) {
    const p = m.playerIds.indexOf(playerId);
    if (p < 0) continue;
    days.add(dayIndex(m.finishedAt));
    const state = replay(m.rules, m.playerIds.length, m.segments);
    const legDarts = new Map<number, number>();
    for (const v of state.visits) {
      if (v.player !== p) continue;
      legDarts.set(v.leg, (legDarts.get(v.leg) ?? 0) + v.darts.length);
      if (v.scored === 180) {
        counts.oneEighty++;
        badges.add("first180");
      } else if (v.scored >= 100) counts.ton++;
      if (v.checkout && v.scored >= 100) {
        counts.bigFinish++;
        badges.add("bigFinish");
      }
      if (v.checkout && v.darts.at(-1) === "Bull") badges.add("bullFinish");
    }
    for (const [i, leg] of state.legs.entries()) {
      if (!leg.order.includes(p)) continue;
      counts.legPlayed++;
      if (leg.order[0] !== p) continue;
      counts.legWon++;
      if ((legDarts.get(i) ?? Infinity) <= 15) badges.add("fifteenDarter");
    }
  }

  let streak = 0;
  let bestStreak = 0;
  for (const d of [...days].sort((a, b) => a - b)) {
    streak = days.has(d - 1) ? streak + 1 : 1;
    if (streak > 1) counts.streakDay++;
    bestStreak = Math.max(bestStreak, streak);
  }
  if (bestStreak >= 5) badges.add("streak5");

  const xp = XP_RULES.reduce((sum, r) => sum + counts[r.key] * r.xp, 0);
  const index = LEVELS.findLastIndex((l) => xp >= l.xp);
  const current = LEVELS[index] ?? LEVELS[0];
  const next = LEVELS[index + 1];
  return {
    xp,
    counts,
    level: index + 1,
    name: current.name,
    levelXp: current.xp,
    nextXp: next?.xp ?? null,
    nextName: next?.name ?? null,
    badges: [...badges],
    bestStreak,
  };
}
