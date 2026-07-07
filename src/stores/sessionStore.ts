import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { ActiveSession, SessionConfig, SessionState, Position, SessionCheckpoint } from '../types';
import { PACE_STEPS_MS } from '../constants/timing';

function generateId(): string {
  return Crypto.randomUUID();
}

interface SessionStore {
  session: ActiveSession | null;
  /** Set by HomeScreen / Routines → SessionModal auto-starts it */
  pendingConfig: SessionConfig | null;
  /** Controls visibility of the DrillConfigModal */
  drillConfigVisible: boolean;
  /** Checkpoint found on startup — drives ResumePromptModal */
  pendingCheckpoint: SessionCheckpoint | null;
  /** Set by ResumePromptModal — engine reads this in startActive to restore time/reps + sessionId + setIndex + livePaceStep */
  resumeFromCheckpoint: { elapsedSeconds: number; repCount: number; sessionId?: string; setIndex?: number; livePaceStep?: number } | null;

  // Drill config modal
  openDrillConfig: () => void;
  closeDrillConfig: () => void;

  // Checkpoint
  setPendingCheckpoint: (cp: SessionCheckpoint | null) => void;
  setResumeFromCheckpoint: (data: { elapsedSeconds: number; repCount: number; sessionId?: string; setIndex?: number; livePaceStep?: number } | null) => void;
  setSessionId: (id: string) => void;

  // Lifecycle
  initSession: (config: SessionConfig, totalPlanned: number, defaultPaceStep?: number) => void;
  endSession: () => void;
  setPendingConfig: (config: SessionConfig) => void;
  clearPendingConfig: () => void;

  // State transitions
  setState: (state: SessionState) => void;
  setCountdown: (value: number) => void;

  // Position / shot
  setCurrentPosition: (pos: Position | null, shot: string | null) => void;
  setNextPosition: (pos: Position | null) => void;
  incrementRep: () => void;
  advanceMove: () => void;
  advanceSet: () => void;

  // Pace
  setPaceStep: (step: number) => void;

  // Timers
  setWorkSecsRemaining: (secs: number) => void;
  setRestSecsRemaining: (secs: number) => void;
  tickElapsed: () => void;
  setElapsedSeconds: (secs: number) => void;
  setRepCount: (count: number) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  pendingConfig: null,
  drillConfigVisible: false,
  pendingCheckpoint: null,
  resumeFromCheckpoint: null,

  openDrillConfig:  () => set({ drillConfigVisible: true }),
  closeDrillConfig: () => set({ drillConfigVisible: false }),

  setPendingCheckpoint: (cp) => set({ pendingCheckpoint: cp }),
  setResumeFromCheckpoint: (data) => set({ resumeFromCheckpoint: data }),

  setPendingConfig:  (config) => set({ pendingConfig: config }),
  clearPendingConfig: ()      => set({ pendingConfig: null }),

  initSession: (config, totalPlanned, defaultPaceStep = 3) => set({
    session: {
      sessionId: generateId(),
      state: 'idle',
      config,
      currentPosition: null,
      nextPosition: null,
      currentShot: null,
      repCount: 0,
      setIndex: 0,
      moveIndex: 0,
      workSecsRemaining: config.duration * 60,
      restSecsRemaining: 0,
      countdownValue: 3,
      totalMovementsPlanned: totalPlanned,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      livePaceStep: defaultPaceStep,
    },
  }),

  endSession: () => set({ session: null }),

  setState: (state) =>
    set((s) => s.session ? { session: { ...s.session, state } } : s),

  setCountdown: (value) =>
    set((s) => s.session ? { session: { ...s.session, countdownValue: value } } : s),

  setCurrentPosition: (pos, shot) =>
    set((s) => s.session ? { session: { ...s.session, currentPosition: pos, currentShot: shot } } : s),

  setNextPosition: (pos) =>
    set((s) => s.session ? { session: { ...s.session, nextPosition: pos } } : s),

  incrementRep: () =>
    set((s) => s.session ? { session: { ...s.session, repCount: s.session.repCount + 1 } } : s),

  advanceMove: () =>
    set((s) => s.session ? { session: { ...s.session, moveIndex: s.session.moveIndex + 1 } } : s),

  advanceSet: () =>
    set((s) =>
      s.session ? { session: { ...s.session, setIndex: s.session.setIndex + 1, moveIndex: 0 } } : s),

  setPaceStep: (step) =>
    set((s) => s.session ? { session: { ...s.session, livePaceStep: Math.min(PACE_STEPS_MS.length - 1, Math.max(0, step)) } } : s),

  setWorkSecsRemaining: (secs) =>
    set((s) => s.session ? { session: { ...s.session, workSecsRemaining: secs } } : s),

  setRestSecsRemaining: (secs) =>
    set((s) => s.session ? { session: { ...s.session, restSecsRemaining: secs } } : s),

  tickElapsed: () =>
    set((s) =>
      s.session ? { session: {
        ...s.session,
        elapsedSeconds: s.session.elapsedSeconds + 1,
        // workSecsRemaining counts down through the full session including rest periods —
        // it tracks total session time remaining, not just active-work time.
        workSecsRemaining: Math.max(0, s.session.workSecsRemaining - 1),
      } } : s),

  setElapsedSeconds: (secs) =>
    set((s) => s.session ? { session: { ...s.session, elapsedSeconds: secs } } : s),

  setRepCount: (count) =>
    set((s) => s.session ? { session: { ...s.session, repCount: count } } : s),

  setSessionId: (id) =>
    set((s) => s.session ? { session: { ...s.session, sessionId: id } } : s),
}));
