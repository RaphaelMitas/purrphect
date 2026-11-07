import type { SQLiteDatabase } from "expo-sqlite";
import {
  addPlayer,
  createMatch,
  type Player,
  playerColor,
  recordSetupUse,
  renameSetup,
  saveDarts,
  setFavorite,
  setInputMode,
} from "@/db/repo";
import { bestRoute } from "@/game/checkout";
import { DAY } from "@/game/levels";
import { suggest } from "@/game/predict";
import { DEFAULT_RULES, type Rules } from "@/game/rules";
import { BOARD_ORDER, info, type Segment, segmentFor } from "@/game/segments";
import { type MatchState, replay, upNext } from "@/game/x01";

interface Skill {
  treble: number;
  double: number;
}

const PLAYERS: { name: string; skill: Skill; growth?: number }[] = [
  { name: "Mia", skill: { treble: 0.1, double: 0.15 }, growth: 0.14 },
  { name: "Leo", skill: { treble: 0.18, double: 0.22 } },
  { name: "Zoe", skill: { treble: 0.1, double: 0.18 } },
  { name: "Max", skill: { treble: 0.15, double: 0.16 } },
  { name: "Ava", skill: { treble: 0.07, double: 0.14 } },
  { name: "Finn", skill: { treble: 0.1, double: 0.12 } },
  { name: "Ivy", skill: { treble: 0.06, double: 0.1 } },
  { name: "Sam", skill: { treble: 0.13, double: 0.2 } },
  { name: "Noah", skill: { treble: 0.08, double: 0.14 } },
  { name: "Lena", skill: { treble: 0.05, double: 0.1 } },
];

const CREW = [0, 1, 2, 3, 4, 5, 6, 7];

const HISTORY: { daysAgo: number; players: number[]; start: number }[] = [
  { daysAgo: 19, players: [0, 1], start: 501 },
  { daysAgo: 18, players: [0, 2, 3], start: 501 },
  { daysAgo: 16, players: [0, 1], start: 501 },
  { daysAgo: 15, players: [0, 4, 5, 6], start: 301 },
  { daysAgo: 13, players: [0, 1], start: 501 },
  { daysAgo: 12, players: [0, 2], start: 501 },
  { daysAgo: 9, players: [0, 3, 7], start: 501 },
  { daysAgo: 8, players: [0, 1], start: 501 },
  { daysAgo: 7, players: [0, 1, 2, 3], start: 501 },
  { daysAgo: 6, players: [0, 5], start: 301 },
  { daysAgo: 5, players: [0, 1], start: 501 },
  { daysAgo: 4, players: [0, 7, 8], start: 501 },
  { daysAgo: 3, players: [0, 1], start: 501 },
  { daysAgo: 2, players: [0, 2, 9], start: 501 },
  { daysAgo: 1, players: [0, 1], start: 501 },
  { daysAgo: 1, players: [0, 3], start: 501 },
];

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickNumber = (rng: Rng) => BOARD_ORDER[Math.floor(rng() * BOARD_ORDER.length)] ?? 20;

function land(aim: Segment, skill: Skill, rng: Rng): Segment {
  const { number, multiplier } = info(aim);
  const r = rng();
  if (number === 0) return aim;
  if (number === 25) {
    if (r < skill.double * 0.7) return "Bull";
    return r < 0.55 ? "25" : segmentFor(pickNumber(rng), 1);
  }
  const i = BOARD_ORDER.indexOf(number);
  const neighbour = BOARD_ORDER[(i + (rng() < 0.5 ? 1 : BOARD_ORDER.length - 1)) % BOARD_ORDER.length] ?? number;
  if (multiplier === 3) {
    if (r < skill.treble) return aim;
    return r < skill.treble + 0.5 ? segmentFor(number, 1) : segmentFor(neighbour, 1);
  }
  if (multiplier === 2) {
    if (r < skill.double) return aim;
    if (r < skill.double + 0.3) return segmentFor(number, 1);
    return r < skill.double + 0.45 ? "Miss" : segmentFor(neighbour, 1);
  }
  return r < 0.88 ? aim : segmentFor(neighbour, 1);
}

function play(rules: Rules, skills: Skill[], rng: Rng, stop: (s: MatchState) => boolean = () => false): Segment[] {
  const darts: Segment[] = [];
  let state = replay(rules, skills.length, darts);
  while (state.winner === null && !stop(state)) {
    const skill = skills[state.current] ?? { treble: 0.2, double: 0.2 };
    darts.push(land(suggest(state).plan[0] ?? "T20", skill, rng));
    state = replay(rules, skills.length, darts);
  }
  return darts;
}

// The screenshot flow taps "25" on the tiles, so the moment must leave a two-dart out and no other "25" on screen.
function showcase(s: MatchState): boolean {
  if (s.leg < 1 || s.current !== 0 || s.visit.length > 0) return false;
  const remaining = s.remaining[0] ?? 0;
  const route = bestRoute(remaining, 3, s.rules.out);
  const first = route?.darts[0];
  const others = upNext(s).map((p) => s.remaining[p] ?? 0);
  return (
    remaining > 100 &&
    route?.darts.length === 3 &&
    first !== undefined &&
    info(first).multiplier === 3 &&
    !route.darts.includes("25") &&
    bestRoute(remaining - 25, 2, s.rules.out)?.darts.length === 2 &&
    !others.includes(25) &&
    others.filter((r) => bestRoute(r, 3, s.rules.out)).length >= 2
  );
}

function openMatchDarts(rules: Rules, skills: Skill[]): Segment[] {
  for (let seed = 1; seed < 200; seed++) {
    const darts = play(rules, skills, mulberry32(seed), showcase);
    if (replay(rules, skills.length, darts).winner === null) return darts;
  }
  throw new Error("No showcase moment found");
}

function eveningOf(daysAgo: number): number {
  const day = new Date();
  day.setHours(19, 30, 0, 0);
  return day.getTime() - daysAgo * DAY;
}

export async function seedDemo(db: SQLiteDatabase) {
  await db.execAsync(
    "DELETE FROM darts; DELETE FROM matches; DELETE FROM setups; DELETE FROM players; DELETE FROM prefs;",
  );
  await setInputMode(db, "board");

  const players: Player[] = [];
  for (const [i, p] of PLAYERS.entries()) {
    const player = await addPlayer(db, p.name, playerColor(i));
    await db.runAsync("UPDATE players SET created_at = ? WHERE id = ?", i, player.id);
    players.push(player);
  }
  const ids = (indices: number[]) => indices.map((i) => players[i]?.id ?? "");
  const skillAt = (i: number, progress: number): Skill => {
    const p = PLAYERS[i];
    const growth = (p?.growth ?? 0) * progress;
    return { treble: (p?.skill.treble ?? 0.2) + growth, double: (p?.skill.double ?? 0.2) + growth };
  };

  const rng = mulberry32(42);
  for (const [n, m] of HISTORY.entries()) {
    const rules: Rules = { ...DEFAULT_RULES, start: m.start, firstTo: m.players.length === 2 ? 3 : 2 };
    const skills = m.players.map((i) => skillAt(i, n / HISTORY.length));
    const id = await createMatch(db, rules, ids(m.players));
    await saveDarts(db, id, play(rules, skills, rng), true);
    const startedAt = eveningOf(m.daysAgo) + n * 10 * 60 * 1000;
    await db.runAsync(
      "UPDATE matches SET started_at = ?, finished_at = ? WHERE id = ?",
      startedAt,
      startedAt + 35 * 60 * 1000,
      id,
    );
  }
  const duel = await recordSetupUse(db, DEFAULT_RULES, ids([0, 1]));
  await setFavorite(db, duel, true);
  await renameSetup(db, duel, "Grudge match");
  await db.runAsync(
    "UPDATE setups SET last_used_at = COALESCE((SELECT MAX(started_at) FROM matches WHERE setup_id = setups.id), last_used_at)",
  );

  const crew: Rules = { ...DEFAULT_RULES, firstTo: 2 };
  const open = await createMatch(db, crew, ids(CREW));
  await saveDarts(
    db,
    open,
    openMatchDarts(
      crew,
      CREW.map((i) => skillAt(i, 1)),
    ),
    false,
  );
  const crewSetup = await recordSetupUse(db, crew, ids(CREW));
  await setFavorite(db, crewSetup, true);
  await renameSetup(db, crewSetup, "Thursday crew");
}
