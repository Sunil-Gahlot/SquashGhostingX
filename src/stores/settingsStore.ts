import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceMode, CourtSystem, CourtMode, DrillType, Tempo, Difficulty, ShotGroup } from '../types';

export interface AppSettings {
  // Audio
  voiceEnabled: boolean;
  beepEnabled: boolean;
  hapticsEnabled: boolean;
  speechRate: number;           // 0.6 – 1.2
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
  movementPaceExtraMs: number;  // extra ms added to T-pause between calls (0 = default)
}

export const DEFAULT_SETTINGS: AppSettings = {
  voiceEnabled: true,
  beepEnabled: true,
  hapticsEnabled: true,
  speechRate: 1.0,
  coachingCues: false,
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
  movementPaceExtraMs: 0,
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
      version: 2,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          const cm = persisted?.state?.settings?.courtMode;
          if (cm === 'hero') persisted.state.settings.courtMode = 'glass';
          if (cm === 'real') persisted.state.settings.courtMode = 'wooden';
        }
        if (version < 2) {
          // Ensure courtMode is a valid value; default to 'wooden' if missing or stale
          const cm = persisted?.state?.settings?.courtMode;
          if (cm !== 'glass' && cm !== 'wooden') {
            if (persisted?.state?.settings) persisted.state.settings.courtMode = 'wooden';
          }
        }
        return persisted;
      },
    }
  )
);
