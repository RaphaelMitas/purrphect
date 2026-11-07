import { randomUUID } from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";
import type { Rules } from "@/game/rules";
import type { Segment } from "@/game/segments";
import type { PlayedMatch } from "@/game/stats";
import { parseIds, parseRules, parseSegment } from "./parse";

export const PLAYER_COLORS = [
  "#FF6FA3",
  "#5FCFAE",
  "#F2B84B",
  "#A58CFF",
  "#5DB7F0",
  "#FF9466",
  "#C06C9A",
  "#8BBF5A",
  "#E86F6F",
  "#4FB3B3",
  "#B38B6D",
  "#7C8CFF",
] as const;

export const playerColor = (i: number): string => PLAYER_COLORS[i % PLAYER_COLORS.length] ?? PLAYER_COLORS[0];

export interface Player {
  id: string;
  name: string;
  color: string;
  guest: boolean;
}

export interface Setup {
  id: string;
  name: string | null;
  favorite: boolean;
  rules: Rules;
  playerIds: string[];
  lastUsedAt: number;
}

export interface Match {
  id: string;
  rules: Rules;
  playerIds: string[];
  startedAt: number;
  finishedAt: number | null;
  segments: Segment[];
}

type PlayerRow = { id: string; name: string; color: string; guest: number };
type SetupRow = {
  id: string;
  name: string | null;
  favorite: number;
  rules: string;
  player_ids: string;
  last_used_at: number;
};
type MatchRow = { id: string; rules: string; player_ids: string; started_at: number; finished_at: number | null };

const toPlayer = (r: PlayerRow): Player => ({ id: r.id, name: r.name, color: r.color, guest: r.guest === 1 });
const toSetup = (r: SetupRow): Setup => ({
  id: r.id,
  name: r.name,
  favorite: r.favorite === 1,
  rules: parseRules(r.rules),
  playerIds: parseIds(r.player_ids),
  lastUsedAt: r.last_used_at,
});

export async function listPlayers(db: SQLiteDatabase): Promise<Player[]> {
  const rows = await db.getAllAsync<PlayerRow>("SELECT id, name, color, guest FROM players ORDER BY created_at");
  return rows.map(toPlayer);
}

async function insertPlayer(db: SQLiteDatabase, name: string, guest: boolean): Promise<Player> {
  const used = await db.getAllAsync<{ color: string; n: number }>(
    "SELECT color, COUNT(*) AS n FROM players GROUP BY color",
  );
  const uses = (c: string) => used.find((u) => u.color === c)?.n ?? 0;
  const color = [...PLAYER_COLORS].sort((a, b) => uses(a) - uses(b))[0] ?? playerColor(0);
  const player: Player = { id: randomUUID(), name, color, guest };
  await db.runAsync(
    "INSERT INTO players (id, name, color, guest, created_at) VALUES (?, ?, ?, ?, ?)",
    player.id,
    name,
    color,
    guest ? 1 : 0,
    Date.now(),
  );
  return player;
}

export function addPlayer(db: SQLiteDatabase, name: string): Promise<Player> {
  return insertPlayer(db, name.trim(), false);
}

export async function addGuest(db: SQLiteDatabase): Promise<Player> {
  const row = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM players WHERE guest = 1");
  return insertPlayer(db, `Guest ${(row?.n ?? 0) + 1}`, true);
}

export async function listSetups(db: SQLiteDatabase): Promise<Setup[]> {
  const rows = await db.getAllAsync<SetupRow>(
    `SELECT id, name, favorite, rules, player_ids, last_used_at FROM setups
     WHERE favorite = 1 OR id IN (SELECT id FROM setups ORDER BY last_used_at DESC LIMIT 30)
     ORDER BY last_used_at DESC`,
  );
  return rows.map(toSetup);
}

const signature = (r: Rules, playerIds: string[]) => JSON.stringify([r.start, r.out, r.firstTo, r.finish, playerIds]);

export async function recordSetupUse(db: SQLiteDatabase, rules: Rules, playerIds: string[]): Promise<string> {
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO setups (id, rules, player_ids, signature, last_used_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(signature) DO UPDATE SET last_used_at = excluded.last_used_at`,
    id,
    JSON.stringify(rules),
    JSON.stringify(playerIds),
    signature(rules, playerIds),
    Date.now(),
  );
  const row = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM setups WHERE signature = ?",
    signature(rules, playerIds),
  );
  return row?.id ?? id;
}

export async function setFavorite(db: SQLiteDatabase, setupId: string, favorite: boolean) {
  await db.runAsync("UPDATE setups SET favorite = ? WHERE id = ?", favorite ? 1 : 0, setupId);
}

export async function renameSetup(db: SQLiteDatabase, setupId: string, name: string) {
  await db.runAsync("UPDATE setups SET name = ? WHERE id = ?", name.trim() || null, setupId);
}

export async function createMatch(db: SQLiteDatabase, rules: Rules, playerIds: string[]): Promise<string> {
  const setupId = await recordSetupUse(db, rules, playerIds);
  const id = randomUUID();
  await db.runAsync(
    "INSERT INTO matches (id, setup_id, rules, player_ids, started_at) VALUES (?, ?, ?, ?, ?)",
    id,
    setupId,
    JSON.stringify(rules),
    JSON.stringify(playerIds),
    Date.now(),
  );
  return id;
}

async function loadSegments(db: SQLiteDatabase, matchId: string): Promise<Segment[]> {
  const rows = await db.getAllAsync<{ segment: string }>(
    "SELECT segment FROM darts WHERE match_id = ? ORDER BY seq",
    matchId,
  );
  return rows.map((r) => parseSegment(r.segment));
}

const toMatch = (r: MatchRow, segments: Segment[]): Match => ({
  id: r.id,
  rules: parseRules(r.rules),
  playerIds: parseIds(r.player_ids),
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  segments,
});

const MATCH_COLUMNS = "id, rules, player_ids, started_at, finished_at";

export async function getMatch(db: SQLiteDatabase, id: string): Promise<Match | null> {
  const row = await db.getFirstAsync<MatchRow>(`SELECT ${MATCH_COLUMNS} FROM matches WHERE id = ?`, id);
  return row ? toMatch(row, await loadSegments(db, row.id)) : null;
}

export async function latestOpenMatch(db: SQLiteDatabase): Promise<Match | null> {
  const row = await db.getFirstAsync<MatchRow>(
    `SELECT ${MATCH_COLUMNS} FROM matches WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? toMatch(row, await loadSegments(db, row.id)) : null;
}

let pendingSaves: Promise<void> = Promise.resolve();

export function savesSettled(): Promise<void> {
  return pendingSaves;
}

// Saves run one after another and rewrite the whole list, so a failed save is repaired by the next one.
export function saveDarts(db: SQLiteDatabase, matchId: string, segments: readonly Segment[], finished: boolean) {
  pendingSaves = pendingSaves
    .then(() =>
      db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM darts WHERE match_id = ?", matchId);
        await db.runAsync(
          "INSERT INTO darts (match_id, seq, segment) SELECT ?, key, value FROM json_each(?)",
          matchId,
          JSON.stringify(segments),
        );
        await db.runAsync("UPDATE matches SET finished_at = ? WHERE id = ?", finished ? Date.now() : null, matchId);
      }),
    )
    .catch(console.error);
  return pendingSaves;
}

export async function deleteMatch(db: SQLiteDatabase, matchId: string) {
  await db.runAsync("DELETE FROM matches WHERE id = ?", matchId);
}

export async function loadPlayersAndMatches(db: SQLiteDatabase) {
  const [players, matches] = await Promise.all([listPlayers(db), finishedMatches(db)]);
  return { players, matches };
}

export function byId(players: readonly Player[]): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}

export async function finishedMatches(db: SQLiteDatabase): Promise<PlayedMatch[]> {
  const rows = await db.getAllAsync<MatchRow>(
    `SELECT ${MATCH_COLUMNS} FROM matches WHERE finished_at IS NOT NULL ORDER BY finished_at`,
  );
  const darts = await db.getAllAsync<{ match_id: string; segment: string }>(
    "SELECT d.match_id, d.segment FROM darts d JOIN matches m ON m.id = d.match_id WHERE m.finished_at IS NOT NULL ORDER BY d.match_id, d.seq",
  );
  const byMatch = new Map<string, Segment[]>();
  for (const d of darts) {
    const list = byMatch.get(d.match_id) ?? [];
    list.push(parseSegment(d.segment));
    byMatch.set(d.match_id, list);
  }
  return rows.map((r) => ({ ...toMatch(r, byMatch.get(r.id) ?? []), finishedAt: r.finished_at ?? r.started_at }));
}

export type InputMode = "board" | "tiles";

export async function getInputMode(db: SQLiteDatabase): Promise<InputMode> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM prefs WHERE key = 'input'");
  return row?.value === "tiles" ? "tiles" : "board";
}

export async function setInputMode(db: SQLiteDatabase, mode: InputMode) {
  await db.runAsync(
    "INSERT INTO prefs (key, value) VALUES ('input', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    mode,
  );
}
