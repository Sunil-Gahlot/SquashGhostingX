import { create } from 'zustand';
import { SessionRecord, ProgressStats, PersonalBest } from '../types';

const EMPTY_STATS: ProgressStats = {
  totalSessions: 0,
  totalMovements: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyActivity: [],
  zoneDistribution: { front: 0, mid: 0, back: 0 },
  personalBests: [],
  lastSessionAt: null,
};

interface ProgressStore {
  recentSessions: SessionRecord[];
  stats: ProgressStats;
  isLoading: boolean;
  /** Timestamp incremented after every session save — screens watch this to reload */
  lastSessionCompletedAt: number;

  setRecentSessions: (sessions: SessionRecord[]) => void;
  setStats:          (stats: ProgressStats) => void;
  setLoading:        (loading: boolean) => void;

  /** Optimistic update — called immediately when session saves (before DB reload) */
  addSession:              (session: SessionRecord) => void;
  /** Triggers reactive reload in HomeScreen / ProgressScreen */
  markSessionCompleted:    () => void;

  clearCache: () => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  recentSessions: [],
  stats: EMPTY_STATS,
  isLoading: false,
  lastSessionCompletedAt: 0,

  setRecentSessions: (sessions) => set({ recentSessions: sessions }),
  setStats:  (stats)   => set({ stats }),
  setLoading:(loading) => set({ isLoading: loading }),

  addSession: (session) =>
    set((s) => ({
      recentSessions: [session, ...s.recentSessions].slice(0, 50),
      stats: {
        ...s.stats,
        totalSessions:  s.stats.totalSessions + 1,
        totalMovements: s.stats.totalMovements + session.movementsTotal,
        totalMinutes:   s.stats.totalMinutes + Math.round(session.durationSeconds / 60),
        lastSessionAt:  session.endedAt,
      },
    })),

  markSessionCompleted: () =>
    set(() => ({ lastSessionCompletedAt: Date.now() })),

  clearCache: () => set({ recentSessions: [], stats: EMPTY_STATS }),
}));
