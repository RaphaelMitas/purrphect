import type { SQLiteDatabase } from "expo-sqlite";

const MIGRATIONS = [
  `
  CREATE TABLE players (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    guest INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE setups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    rules TEXT NOT NULL,
    player_ids TEXT NOT NULL,
    signature TEXT NOT NULL UNIQUE,
    last_used_at INTEGER NOT NULL
  );
  CREATE TABLE matches (
    id TEXT PRIMARY KEY NOT NULL,
    setup_id TEXT REFERENCES setups(id) ON DELETE SET NULL,
    rules TEXT NOT NULL,
    player_ids TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );
  CREATE TABLE darts (
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    segment TEXT NOT NULL,
    PRIMARY KEY (match_id, seq)
  );
  CREATE TABLE prefs (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    if (sql === undefined) break;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(sql);
      await tx.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
    version++;
  }
}
