import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserProfile, DominantHand, SkillLevel, VoiceGender, TrainingGoal, Language } from '../types';

// SecureStore key for PII fields (name, dob, gender) — kept out of plaintext AsyncStorage
const SGX_PII_KEY    = 'sgx-user-pii';
const PII_FIELDS     = ['name', 'dobDay', 'dobMonth', 'dobYear', 'gender'] as const;
type PiiField        = typeof PII_FIELDS[number];

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
  hasStartedAnySession: boolean;
  hasAcceptedTerms: boolean;
  hasShownAndroidVolumeHint: boolean;

  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  completeAuth: (email?: string) => void;
  signOut: () => void;
  resetProfile: () => void;
  deleteAccount: () => void;
  markCourtTutorialSeen: () => void;
  markPaceTutorialSeen: () => void;
  markSessionStarted: () => void;
  acceptTerms: () => void;
  markAndroidVolumeHintShown: () => void;
  hydratePii: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      isOnboardingComplete: false,
      hasCompletedAuth: false,
      hasSeenCourtTutorial: false,
      hasSeenPaceTutorial: false,
      hasStartedAnySession: false,
      hasAcceptedTerms: false,
      hasShownAndroidVolumeHint: false,

      setProfile: (updates) => {
        // Capture new PII outside the set() callback so we can write async after state settles
        let newPii: Record<string, string | null> | null = null;
        set((s) => {
          const newProfile = { ...s.profile, ...updates };
          if ((PII_FIELDS as readonly string[]).some(k => k in updates)) {
            newPii = {
              name:     newProfile.name,
              dobDay:   newProfile.dobDay,
              dobMonth: newProfile.dobMonth,
              dobYear:  newProfile.dobYear,
              gender:   newProfile.gender,
            };
          }
          return { profile: newProfile };
        });
        if (newPii !== null) {
          SecureStore.setItemAsync(SGX_PII_KEY, JSON.stringify(newPii)).catch(() => {});
        }
      },

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

      signOut: () => {
        SecureStore.deleteItemAsync(SGX_PII_KEY).catch(() => {});
        set({
          profile:               DEFAULT_PROFILE,
          hasCompletedAuth:      false,
          hasStartedAnySession:  false,
          // isOnboardingComplete, hasSeenCourtTutorial, hasSeenPaceTutorial,
          // hasShownAndroidVolumeHint, hasAcceptedTerms: all device-level, survive sign-out
        });
      },

      resetProfile: () => {
        SecureStore.deleteItemAsync(SGX_PII_KEY).catch(() => {});
        set({ profile: DEFAULT_PROFILE, isOnboardingComplete: false, hasCompletedAuth: false, hasSeenCourtTutorial: false, hasSeenPaceTutorial: false, hasStartedAnySession: false, hasAcceptedTerms: false, hasShownAndroidVolumeHint: false });
      },

      deleteAccount: () => {
        SecureStore.deleteItemAsync(SGX_PII_KEY).catch(() => {});
        set({ profile: DEFAULT_PROFILE, isOnboardingComplete: false, hasCompletedAuth: false, hasAcceptedTerms: false, hasSeenCourtTutorial: false, hasSeenPaceTutorial: false, hasStartedAnySession: false, hasShownAndroidVolumeHint: false });
      },

      markCourtTutorialSeen: () => set({ hasSeenCourtTutorial: true }),
      markPaceTutorialSeen: () => set({ hasSeenPaceTutorial: true }),
      markSessionStarted: () => set({ hasStartedAnySession: true }),
      acceptTerms: () => set({ hasAcceptedTerms: true }),
      markAndroidVolumeHintShown: () => set({ hasShownAndroidVolumeHint: true }),

      hydratePii: async () => {
        try {
          const raw = await SecureStore.getItemAsync(SGX_PII_KEY);
          if (!raw) return;
          const pii = JSON.parse(raw) as Partial<Pick<UserProfile, PiiField>>;
          set((s) => ({ profile: { ...s.profile, ...pii } }));
        } catch {}
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 9,

      // Deep-merge persisted profile with initial state so DEFAULT_PROFILE fields
      // act as fallbacks for any fields absent from the stored JSON (e.g. PII fields
      // stripped by partialize below).
      merge: (persistedState: any, currentState: ProfileStore) => ({
        ...currentState,
        ...persistedState,
        profile: {
          ...currentState.profile,
          ...(persistedState as any)?.profile,
        },
      }),

      // Strip PII (name, dob, gender) from AsyncStorage — stored in SecureStore instead.
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { name: _n, dobDay: _dd, dobMonth: _dm, dobYear: _dy, gender: _g, ...safeProfile } = state.profile;
        return { ...state, profile: safeProfile as UserProfile };
      },

      // After AsyncStorage hydration: migrate existing PII to SecureStore (one-time, v8→v9),
      // then load PII back into state. The subsequent set() triggers partialize, which writes
      // the AsyncStorage blob without PII — completing the migration atomically.
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        (async () => {
          try {
            const existing = await SecureStore.getItemAsync(SGX_PII_KEY);
            if (!existing && (state.profile.name || state.profile.dobDay || state.profile.gender)) {
              await SecureStore.setItemAsync(SGX_PII_KEY, JSON.stringify({
                name:     state.profile.name,
                dobDay:   state.profile.dobDay,
                dobMonth: state.profile.dobMonth,
                dobYear:  state.profile.dobYear,
                gender:   state.profile.gender,
              }));
            }
          } catch {}
          state.hydratePii();
        })();
      },

      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          persisted = { ...persisted, hasCompletedAuth: false };
        }
        if (version < 2) {
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
        if (version < 4) {
          if (persisted?.state) {
            if (persisted.state.hasStartedAnySession === undefined) persisted.state.hasStartedAnySession = false;
          }
        }
        if (version < 5) {
          if (persisted?.state) {
            if (persisted.state.hasAcceptedTerms === undefined) persisted.state.hasAcceptedTerms = false;
          }
        }
        if (version < 6) {
          if (persisted?.state) {
            if (persisted.state.hasShownAndroidVolumeHint === undefined) persisted.state.hasShownAndroidVolumeHint = false;
          }
        }
        if (version < 7) {
          // Originally forced re-acceptance for all users. Reverted in v8 below.
        }
        if (version < 8) {
          // Restore hasAcceptedTerms for users affected by the v7 forced reset.
          if (persisted?.state && persisted.state.hasCompletedAuth) {
            persisted.state.hasAcceptedTerms = true;
          }
        }
        if (version < 9) {
          // PII (name, dob, gender) moved from AsyncStorage to SecureStore (SGX_PII_KEY).
          // One-time migration handled in onRehydrateStorage above — no sync work needed here.
        }
        return persisted;
      },
    }
  )
);
