import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceMode, CourtSystem, CourtMode, DrillType, Tempo, Difficulty, ShotGroup } from '../types';

export interface AppSettings {
  // Audio
  voiceEnabled: boolean;
  hapticsEnabled: boolean;
  speechRate: number;           // 0.7 – 1.6
  coachingCues: boolean;        // mid-session encouragement
  // Session defaults (pre-filled on S-12)
  defaultDrillType: DrillType;
  defaultCourtSystem: CourtSystem;
  defaultTempo: Tempo;
  defaultDifficulty: Difficulty;
  defaultDuration: number;      // minutes
  defaultVoiceMode: VoiceMode;
  defaultShotGroups: ShotGroup[];
  // Display
  keepScreenAwake: boolean;
  reducedMotion: boolean;
  courtMode: CourtMode;
  // Pace
  defaultPaceStep: number;  // 0–6, index into PACE_STEPS_MS; 3 = Normal
  // Voice
  preferredVoiceId?: string;  // undefined = auto-select best available
}

export const DEFAULT_SETTINGS: AppSettings = {
  voiceEnabled: true,
  hapticsEnabled: true,
  speechRate: 1.0,
  coachingCues: true,
  defaultDrillType: 'movement',
  defaultCourtSystem: '6pt',
  defaultTempo: 'natural',
  defaultDifficulty: 'intermediate',
  defaultDuration: 10,
  defaultVoiceMode: 'voice+visual',
  defaultShotGroups: ['mixed'],
  keepScreenAwake: true,
  reducedMotion: false,
  courtMode: 'wooden',
  defaultPaceStep: 3,
};

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          const cm = persisted?.state?.settings?.courtMode;
          if (cm === 'hero') persisted.state.settings.courtMode = 'glass';
          if (cm === 'real') persisted.state.settings.courtMode = 'wooden';
        }
        if (version < 2) {
          const cm = persisted?.state?.settings?.courtMode;
          if (cm !== 'glass' && cm !== 'wooden') {
            if (persisted?.state?.settings) persisted.state.settings.courtMode = 'wooden';
          }
        }
        if (version < 3) {
          if (persisted?.state?.settings) {
            delete persisted.state.settings.beepEnabled;
          }
        }
        if (version < 4) {
          const s = persisted?.state?.settings;
          if (s) {
            const extraMs = s.movementPaceExtraMs ?? 0;
            const msSteps = [3000, 2000, 1000, 0, -1000, -2000, -3000];
            const idx = msSteps.indexOf(extraMs);
            s.defaultPaceStep = idx >= 0 ? idx : 3;
            delete s.movementPaceExtraMs;
          }
        }
        if (version < 5) {
          const s = persisted?.state?.settings;
          if (s && s.speechRate === 0.95) s.speechRate = 0.85;
        }
        if (version < 6) {
          // Bump old default 0.85 → 1.0 (more energetic coaching delivery).
          // Users who manually set 0.85 away from the old default also benefit.
          const s = persisted?.state?.settings;
          if (s && s.speechRate === 0.85) s.speechRate = 1.0;
        }
        return persisted;
      },
    }
  )
);
