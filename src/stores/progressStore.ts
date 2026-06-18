import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  /** Set to sessionId when the just-completed session set a new movements PB; cleared on dismiss */
  newPBSessionId: string | null;

  setRecentSessions: (sessions: SessionRecord[]) => void;
  setStats:          (stats: ProgressStats) => void;
  setLoading:        (loading: boolean) => void;

  /** Optimistic update — called immediately when session saves (before DB reload) */
  addSession:              (session: SessionRecord) => void;
  /** Triggers reactive reload in HomeScreen / ProgressScreen */
  markSessionCompleted:    () => void;

  setNewPBFlag: (sessionId: string | null) => void;
  clearCache: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      recentSessions: [],
      stats: EMPTY_STATS,
      isLoading: false,
      lastSessionCompletedAt: 0,
      newPBSessionId: null,

      setRecentSessions: (sessions) => set({ recentSessions: sessions }),
      setStats:  (stats)   => set({ stats }),
      setLoading:(loading) => set({ isLoading: loading }),

      addSession: (session) =>
        set((s) => {
          // BUG-033: optimistically update weeklyActivity so the chart refreshes immediately.
          const today = new Date().toLocaleDateString('en-CA');
          const prev  = s.stats.weeklyActivity;
          const existIdx = prev.findIndex((d) => d.date === today);
          let weeklyActivity: typeof prev;
          if (existIdx >= 0) {
            weeklyActivity = prev.map((d, i) =>
              i === existIdx
                ? { ...d, movements: d.movements + session.movementsTotal, intensity: Math.max(d.intensity, session.intensityScore) }
                : d
            );
          } else {
            weeklyActivity = [...prev, { date: today, movements: session.movementsTotal, intensity: session.intensityScore }]
              .sort((a, b) => a.date.localeCompare(b.date));
          }
          return {
            recentSessions: [session, ...s.recentSessions].slice(0, 100),
            stats: {
              ...s.stats,
              totalSessions:  s.stats.totalSessions + 1,
              totalMovements: s.stats.totalMovements + session.movementsTotal,
              totalMinutes:   s.stats.totalMinutes + Math.round(session.durationSeconds / 60),
              lastSessionAt:  session.endedAt,
              weeklyActivity,
            },
          };
        }),

      markSessionCompleted: () =>
        set(() => ({ lastSessionCompletedAt: Date.now() })),

      setNewPBFlag: (sessionId) => set({ newPBSessionId: sessionId }),

      clearCache: () => set({ recentSessions: [], stats: EMPTY_STATS, newPBSessionId: null }),
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist stats and recentSessions; transient fields reset each launch.
      partialize: (state) => ({
        stats: state.stats,
        recentSessions: state.recentSessions,
      }),
    }
  )
);
