import { type SQLiteDatabase } from 'expo-sqlite';

/** Run a single SQL statement, silently ignoring errors (e.g. "duplicate column"). */
async function safeExec(db: SQLiteDatabase, sql: string): Promise<void> {
  try { await db.execAsync(sql); } catch {}
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  // ── Base pragmas ─────────────────────────────────────────────────────────────
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);

  // ── Create tables (safe for both fresh DBs and existing ones) ───────────────
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      age INTEGER,
      gender TEXT,
      dominant_hand TEXT NOT NULL DEFAULT 'right',
      skill_level TEXT NOT NULL DEFAULT 'intermediate',
      training_goal TEXT NOT NULL DEFAULT 'fitness',
      voice_gender TEXT NOT NULL DEFAULT 'female',
      language TEXT NOT NULL DEFAULT 'en-US',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      drill_type TEXT NOT NULL DEFAULT 'movement',
      court_system TEXT NOT NULL DEFAULT '6pt',
      tempo TEXT NOT NULL DEFAULT 'natural',
      difficulty TEXT NOT NULL DEFAULT 'intermediate',
      duration_s INTEGER NOT NULL DEFAULT 0,
      movements_total INTEGER NOT NULL DEFAULT 0,
      movements_planned INTEGER NOT NULL DEFAULT 0,
      completion_pct REAL NOT NULL DEFAULT 0,
      intensity_score REAL NOT NULL DEFAULT 0,
      zone_front_pct REAL NOT NULL DEFAULT 0,
      zone_mid_pct REAL NOT NULL DEFAULT 0,
      zone_back_pct REAL NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT '',
      ended_at TEXT,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      position TEXT NOT NULL,
      shot TEXT,
      timestamp_offset_ms INTEGER NOT NULL DEFAULT 0,
      set_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      session_id TEXT PRIMARY KEY NOT NULL,
      config_json TEXT NOT NULL,
      set_index INTEGER NOT NULL DEFAULT 0,
      move_index INTEGER NOT NULL DEFAULT 0,
      movements_done INTEGER NOT NULL DEFAULT 0,
      elapsed_s INTEGER NOT NULL DEFAULT 0,
      saved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_bests (
      user_id TEXT NOT NULL,
      drill_type TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      session_id TEXT NOT NULL,
      achieved_at TEXT NOT NULL,
      PRIMARY KEY (user_id, drill_type, metric)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_movements_session_id ON movements(session_id);
  `);

  // ── Additive migrations — safe ALTER TABLE for any columns added after v1 ───
  // SQLite throws "duplicate column name" if the column already exists;
  // safeExec swallows that so this is idempotent on every app launch.
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'intermediate'`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN zone_front_pct REAL NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN zone_mid_pct REAL NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN zone_back_pct REAL NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN completion_pct REAL NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN intensity_score REAL NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN movements_planned INTEGER NOT NULL DEFAULT 0`);
  await safeExec(db, `ALTER TABLE sessions ADD COLUMN ended_at TEXT`);
  await safeExec(db, `ALTER TABLE personal_bests ADD COLUMN session_id TEXT NOT NULL DEFAULT ''`);
  await safeExec(db, `ALTER TABLE personal_bests ADD COLUMN achieved_at TEXT NOT NULL DEFAULT ''`);
}
