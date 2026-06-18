import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useProgressStore } from '../stores/progressStore';
import { getProgressStats, getRecentSessions } from '../db/queries';

/**
 * Shared hook for loading progress data from SQLite into the progress store.
 * Both HomeScreen and ProgressScreen use this so the data stays consistent.
 * Call loadData() on mount, on focus, and after session completion.
 */
export function useProgressLoader() {
  const db = useSQLiteContext() as any;
  const { setStats, setRecentSessions, setLoading } = useProgressStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, sessions] = await Promise.all([
        getProgressStats(db),
        getRecentSessions(db, 100),
      ]);
      setStats(stats);
      setRecentSessions(sessions);
    } catch (e) {
      console.warn('[Progress] Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  return { loadData };
}
