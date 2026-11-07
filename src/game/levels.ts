import type { PlayerStats } from "./stats";

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

export const DAY = 24 * 60 * 60 * 1000;
export const dayIndex = (at: number) => Math.floor((at - new Date(at).getTimezoneOffset() * 60 * 1000) / DAY);

export function progressFor(stats: PlayerStats): Progress {
  const counts: Record<XpKey, number> = {
    legPlayed: stats.legsPlayed,
    legWon: stats.legsWon,
    ton: stats.bands["100+"] + stats.bands["140+"],
    oneEighty: stats.bands["180"],
    bigFinish: stats.bigFinishes,
    streakDay: 0,
  };
  const badges = new Set<BadgeKey>();
  if (stats.bands["180"] > 0) badges.add("first180");
  if (stats.bigFinishes > 0) badges.add("bigFinish");
  if (stats.bullFinishes > 0) badges.add("bullFinish");
  if (stats.bestLegDarts !== null && stats.bestLegDarts <= 15) badges.add("fifteenDarter");
  const days = new Set(stats.playedAt.map(dayIndex));

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
