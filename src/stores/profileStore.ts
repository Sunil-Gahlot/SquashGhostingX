import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DominantHand, SkillLevel, VoiceGender, TrainingGoal, Language } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: '',
  age: null,
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  gender: 'male',
  photoUri: null,
  dominantHand: 'right',
  skillLevel: 'intermediate',
  trainingGoal: 'fitness',
  voiceGender: 'female',
  voiceStyle: 'calm',
  language: 'en-US',
  isGuest: true,
  createdAt: new Date().toISOString(),
};

interface ProfileStore {
  profile: UserProfile;
  isOnboardingComplete: boolean;
  hasCompletedAuth: boolean;
  hasSeenCourtTutorial: boolean;
  hasSeenPaceTutorial: boolean;

  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  completeAuth: (email?: string) => void;
  signOut: () => void;
  resetProfile: () => void;
  markCourtTutorialSeen: () => void;
  markPaceTutorialSeen: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      isOnboardingComplete: false,
      hasCompletedAuth: false,
      hasSeenCourtTutorial: false,
      hasSeenPaceTutorial: false,

      setProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: () => set({ isOnboardingComplete: true }),

      completeAuth: (email) =>
        set((s) => ({
          hasCompletedAuth: true,
          profile: {
            ...s.profile,
            isGuest: !email,
            ...(email ? {
              name: s.profile.name || email.split('@')[0],
            } : {}),
          },
        })),

      signOut: () =>
        set((s) => ({
          hasCompletedAuth: false,
          profile: { ...s.profile, isGuest: true },
        })),

      resetProfile: () =>
        set({ profile: DEFAULT_PROFILE, isOnboardingComplete: false, hasCompletedAuth: false, hasSeenCourtTutorial: false, hasSeenPaceTutorial: false }),

      markCourtTutorialSeen: () => set({ hasSeenCourtTutorial: true }),
      markPaceTutorialSeen: () => set({ hasSeenPaceTutorial: true }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          persisted = { ...persisted, hasCompletedAuth: false };
        }
        if (version < 2) {
          // Add DOB fields and normalise null gender
          if (persisted?.state?.profile) {
            const p = persisted.state.profile;
            if (!p.dobDay)   p.dobDay   = '';
            if (!p.dobMonth) p.dobMonth = '';
            if (!p.dobYear)  p.dobYear  = '';
            if (!p.gender)   p.gender   = 'male';
          }
        }
        if (version < 3) {
          if (persisted?.state) {
            if (persisted.state.hasSeenCourtTutorial === undefined) persisted.state.hasSeenCourtTutorial = false;
            if (persisted.state.hasSeenPaceTutorial === undefined)  persisted.state.hasSeenPaceTutorial  = false;
          }
        }
        return persisted;
      },
    }
  )
);
