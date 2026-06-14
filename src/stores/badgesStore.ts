import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BadgeId =
  | 'first_session'
  | 'streak_7'
  | 'movements_100'
  | 'elite_difficulty'
  | 'perfect_session';

export interface BadgeDef {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id:          'first_session',
    label:       'First Steps',
    description: 'Complete your first session',
    icon:        'footsteps',
    color:       '#34C759',
  },
  {
    id:          'streak_7',
    label:       'On Fire',
    description: '7-day training streak',
    icon:        'flame',
    color:       '#FF4500',
  },
  {
    id:          'movements_100',
    label:       'Century',
    description: '100 total movements',
    icon:        'walk',
    color:       '#0A84FF',
  },
  {
    id:          'elite_difficulty',
    label:       'Elite',
    description: 'Complete a session at Elite or Pro',
    icon:        'trophy',
    color:       '#FFD60A',
  },
  {
    id:          'perfect_session',
    label:       'Ghost',
    description: 'Complete a session at 100%',
    icon:        'ribbon',
    color:       '#BF5AF2',
  },
];

interface BadgesStore {
  earned: Partial<Record<BadgeId, string>>;
  awardBadge: (id: BadgeId) => void;
  hasBadge: (id: BadgeId) => boolean;
}

export const useBadgesStore = create<BadgesStore>()(
  persist(
    (set, get) => ({
      earned: {},
      awardBadge: (id) =>
        set((s) => ({
          earned: s.earned[id] ? s.earned : { ...s.earned, [id]: new Date().toISOString() },
        })),
      hasBadge: (id) => !!get().earned[id],
    }),
    {
      name: 'badges-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
