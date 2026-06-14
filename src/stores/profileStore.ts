import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DominantHand, SkillLevel, VoiceGender, TrainingGoal, Language } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: '',
  age: null,
  gender: null,
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

  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  completeAuth: (email?: string) => void;
  signOut: () => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      isOnboardingComplete: false,
      hasCompletedAuth: false,

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
        set({ profile: DEFAULT_PROFILE, isOnboardingComplete: false, hasCompletedAuth: false }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          return { ...persisted, hasCompletedAuth: false };
        }
        return persisted;
      },
    }
  )
);
