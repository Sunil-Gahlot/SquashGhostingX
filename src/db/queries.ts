import { type SQLiteDatabase } from 'expo-sqlite';
import { SessionRecord, MovementRecord, SessionCheckpoint, ProgressStats, WeeklyActivity, ZoneDistribution, PersonalBest, DrillType } from '../types';

type DB = SQLiteDatabase;

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function saveSession(
  db: DB,
  session: SessionRecord
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sessions
     (id, drill_type, court_system, tempo, difficulty, duration_s,
      movements_total, movements_planned, completion_pct, intensity_score,
      zone_front_pct, zone_mid_pct, zone_back_pct, started_at, ended_at, synced)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    session.id, session.drillType, session.courtSystem, session.tempo,
    session.difficulty, session.durationSeconds, session.movementsTotal,
    session.movementsPlanned, session.completionPct, session.intensityScore,
    session.zoneFrontPct, session.zoneMidPct, session.zoneBackPct,
    session.startedAt, session.endedAt, session.synced ? 1 : 0
  );
}

export async function getRecentSessions(
  db: DB,
  limit = 30
): Promise<SessionRecord[]> {
  const rows = await db.getAllAsync<{
    id: string; drill_type: string; court_system: string; tempo: string;
    difficulty: string; duration_s: number; movements_total: number;
    movements_planned: number; completion_pct: number; intensity_score: number;
    zone_front_pct: number; zone_mid_pct: number; zone_back_pct: number;
    started_at: string; ended_at: string; synced: number;
  }>('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?', limit);

  return rows.map((r) => ({
    id: r.id,
    drillType: r.drill_type as SessionRecord['drillType'],
    courtSystem: r.court_system as SessionRecord['courtSystem'],
    tempo: r.tempo as SessionRecord['tempo'],
    difficulty: r.difficulty as SessionRecord['difficulty'],
    durationSeconds: r.duration_s,
    movementsTotal: r.movements_total,
    movementsPlanned: r.movements_planned,
    completionPct: r.completion_pct,
    intensityScore: r.intensity_score,
    zoneFrontPct: r.zone_front_pct,
    zoneMidPct: r.zone_mid_pct,
    zoneBackPct: r.zone_back_pct,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    synced: r.synced === 1,
  }));
}

// ─── Movements ────────────────────────────────────────────────────────────────

export async function saveMovements(
  db: DB,
  movements: MovementRecord[]
): Promise<void> {
  for (const m of movements) {
    await db.runAsync(
      'INSERT INTO movements (session_id, position, shot, timestamp_offset_ms, set_index) VALUES (?,?,?,?,?)',
      m.sessionId, m.position, m.shot ?? null, m.timestampOffsetMs, m.setIndex
    );
  }
}

// ─── Checkpoints ─────────────────────────────────────────────────────────────

export async function saveCheckpoint(
  db: DB,
  cp: SessionCheckpoint
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO checkpoints
     (session_id, config_json, set_index, move_index, movements_done, elapsed_s, saved_at)
     VALUES (?,?,?,?,?,?,?)`,
    cp.sessionId, JSON.stringify(cp.config), cp.setIndex,
    cp.moveIndex, cp.movementsCompleted, cp.elapsedSeconds, cp.savedAt
  );
}

export async function getCheckpoint(db: DB): Promise<SessionCheckpoint | null> {
  const row = await db.getFirstAsync<{
    session_id: string; config_json: string; set_index: number;
    move_index: number; movements_done: number; elapsed_s: number; saved_at: string;
  }>('SELECT * FROM checkpoints ORDER BY saved_at DESC LIMIT 1');

  if (!row) return null;
  let config: any;
  try {
    config = JSON.parse(row.config_json);
  } catch {
    // Corrupt checkpoint — delete it so it doesn't block future sessions.
    await db.runAsync('DELETE FROM checkpoints').catch(() => {});
    return null;
  }
  return {
    sessionId: row.session_id,
    config,
    setIndex: row.set_index,
    moveIndex: row.move_index,
    movementsCompleted: row.movements_done,
    elapsedSeconds: row.elapsed_s,
    savedAt: row.saved_at,
  };
}

export async function deleteCheckpoint(db: DB): Promise<void> {
  await db.runAsync('DELETE FROM checkpoints');
}

// ─── Personal Bests ───────────────────────────────────────────────────────────

/**
 * Upserts a personal best only when the new value exceeds the existing record.
 * Returns true if a new record was set.
 */
export async function upsertPersonalBest(
  db: DB,
  drillType: string,
  metric: string,
  value: number,
  sessionId: string,
  achievedAt: string
): Promise<boolean> {
  const existing = await db.getFirstAsync<{ value: number }>(
    `SELECT value FROM personal_bests WHERE user_id = '' AND drill_type = ? AND metric = ?`,
    drillType, metric
  );

  if (existing && existing.value >= value) return false;

  await db.runAsync(
    `INSERT OR REPLACE INTO personal_bests (user_id, drill_type, metric, value, session_id, achieved_at)
     VALUES ('', ?, ?, ?, ?, ?)`,
    drillType, metric, value, sessionId, achievedAt
  );
  return true;
}

// ─── Progress / Analytics ─────────────────────────────────────────────────────

export async function getProgressStats(db: DB): Promise<ProgressStats> {
  const totals = await db.getFirstAsync<{
    total_sessions: number; total_movements: number; total_minutes: number; last_at: string | null;
  }>(`
    SELECT COUNT(*) as total_sessions,
           SUM(movements_total) as total_movements,
           SUM(duration_s / 60) as total_minutes,
           MAX(started_at) as last_at
    FROM sessions WHERE ended_at IS NOT NULL
  `);

  // Weekly activity (last 7 days)
  const weekRows = await db.getAllAsync<{ day: string; movements: number; intensity: number }>(`
    SELECT date(started_at) as day,
           SUM(movements_total) as movements,
           AVG(intensity_score) as intensity
    FROM sessions
    WHERE started_at >= date('now', '-6 days') AND ended_at IS NOT NULL
    GROUP BY day ORDER BY day ASC
  `);

  const weeklyActivity: WeeklyActivity[] = weekRows.map((r) => ({
    date: r.day, movements: r.movements, intensity: r.intensity,
  }));

  // Zone distribution (all time)
  const zoneRow = await db.getFirstAsync<{ f: number; m: number; b: number }>(`
    SELECT AVG(zone_front_pct) as f, AVG(zone_mid_pct) as m, AVG(zone_back_pct) as b
    FROM sessions WHERE ended_at IS NOT NULL
  `);

  const zoneDistribution: ZoneDistribution = {
    front: zoneRow?.f ?? 0,
    mid:   zoneRow?.m ?? 0,
    back:  zoneRow?.b ?? 0,
  };

  // Streak calculation — compare consecutive rows rather than against today-minus-i
  // so gaps are detected correctly regardless of whether the user trained today.
  const dayRows = await db.getAllAsync<{ day: string }>(`
    SELECT DISTINCT date(started_at) as day FROM sessions
    WHERE ended_at IS NOT NULL ORDER BY day DESC
  `);

  let currentStreak = 0;
  let longestStreak = 0;

  if (dayRows.length > 0) {
    // Longest streak: walk all rows, break when a gap > 1 day is found.
    let run = 1;
    for (let i = 1; i < dayRows.length; i++) {
      const prev = new Date(dayRows[i - 1].day + 'T00:00:00Z');
      const curr = new Date(dayRows[i].day + 'T00:00:00Z');
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
      if (diffDays === 1) {
        run++;
      } else {
        longestStreak = Math.max(longestStreak, run);
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);

    // Current streak: only active if the most recent training day is today or yesterday.
    const todayStr     = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (dayRows[0].day === todayStr || dayRows[0].day === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < dayRows.length; i++) {
        const prev = new Date(dayRows[i - 1].day + 'T00:00:00Z');
        const curr = new Date(dayRows[i].day + 'T00:00:00Z');
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Personal bests
  const pbRows = await db.getAllAsync<{
    drill_type: string; metric: string; value: number; session_id: string; achieved_at: string;
  }>(`SELECT drill_type, metric, value, session_id, achieved_at FROM personal_bests WHERE user_id = ''`);

  const personalBests: PersonalBest[] = pbRows.map((r) => ({
    drillType: r.drill_type as DrillType,
    metric: r.metric as PersonalBest['metric'],
    value: r.value,
    sessionId: r.session_id,
    achievedAt: r.achieved_at,
  }));

  return {
    totalSessions: totals?.total_sessions ?? 0,
    totalMovements: totals?.total_movements ?? 0,
    totalMinutes: totals?.total_minutes ?? 0,
    currentStreak,
    longestStreak,
    weeklyActivity,
    zoneDistribution,
    personalBests,
    lastSessionAt: totals?.last_at ?? null,
  };
}
