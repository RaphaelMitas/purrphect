import type { PlayerStats } from "./stats";

export const LEVELS = [
  { key: "kitten", xp: 0 },
  { key: "yarnChaser", xp: 150 },
  { key: "alleyCat", xp: 400 },
  { key: "housePanther", xp: 750 },
  { key: "tomcat", xp: 1200 },
  { key: "whiskerWizard", xp: 1750 },
  { key: "purrfessional", xp: 2300 },
  { key: "topCat", xp: 3000 },
  { key: "lionheart", xp: 4500 },
  { key: "purrphect", xp: 6500 },
] as const;

export type LevelKey = (typeof LEVELS)[number]["key"];

export const XP_RULES = [
  { key: "legPlayed", xp: 20 },
  { key: "legWon", xp: 50 },
  { key: "ton", xp: 10 },
  { key: "oneEighty", xp: 100 },
  { key: "bigFinish", xp: 80 },
  { key: "streakDay", xp: 30 },
] as const;

export type XpKey = (typeof XP_RULES)[number]["key"];

export type BadgeKey = "first180" | "bigFinish" | "bullFinish" | "streak5" | "fifteenDarter";

export interface Progress {
  xp: number;
  counts: Record<XpKey, number>;
  level: number;
  levelKey: LevelKey;
  levelXp: number;
  nextXp: number | null;
  nextLevelKey: LevelKey | null;
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
    levelKey: current.key,
    levelXp: current.xp,
    nextXp: next?.xp ?? null,
    nextLevelKey: next?.key ?? null,
    badges: [...badges],
    bestStreak,
  };
}
