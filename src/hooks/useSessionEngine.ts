import { useRef, useCallback, useEffect } from 'react';
import { type SQLiteDatabase } from 'expo-sqlite';

import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore, DEFAULT_SETTINGS } from '../stores/settingsStore';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';

import { createGhostingEngine, type GhostingEngine } from '../engine/ghostingEngine';
import * as Audio from '../engine/audioEngine';
import * as Haptics from '../engine/hapticsEngine';

import { SessionConfig, SessionRecord, MovementRecord } from '../types';
import {
  getPositionLabel, POSITION_ZONE, POSITION_INFO,
} from '../constants/positions';
import {
  AUDIO_OFFSETS, MOVEMENT_PHASE_MS, MOVES_PER_SET, getIntervalMs,
  getAutoRestMs, CHECKPOINT_INTERVAL_MS, COUNTDOWN_SECONDS,
  T_POSE_CLEAR_DELAY_MS, T_START_PAUSE_MS, PACE_STEPS_MS, PACE_DEFAULT_STEP,
} from '../constants/timing';
import {
  saveSession, saveMovements, saveCheckpoint, deleteCheckpoint, upsertPersonalBest,
} from '../db/queries';
import { useBadgesStore } from '../stores/badgesStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerId = ReturnType<typeof setTimeout>;
type IntervalId = ReturnType<typeof setInterval>;

// ─── Voice call builder — builds one complete call phrase per spec ─────────────

// Movement cues by zone — short squash coaching calls
const MOVEMENT_MODIFIERS = {
  front: ['lunge', 'quick lunge', 'reach low'],
  mid:   ['shuffle across', 'step and split', 'side step'],
  back:  ['sprint back', 'full stretch', 'drive back'],
} as const;

function getMovementModifier(zone: string, callIndex: number): string {
  const arr = MOVEMENT_MODIFIERS[zone as keyof typeof MOVEMENT_MODIFIERS] ?? MOVEMENT_MODIFIERS.mid;
  return arr[callIndex % arr.length];
}

/**
 * Build position instruction. Recovery cue fires separately at ~65% of interval.
 * Format: "[position], [modifier/shot]" — comma gives TTS a natural brief pause.
 */
function buildVoiceCall(opts: {
  drillType: string;
  positionLabel: string;
  positionZone: string;
  shot: string | null;
  nextPositionLabel: string | null;
  callIndex: number;
}): string {
  const { drillType, positionLabel, positionZone, shot, nextPositionLabel, callIndex } = opts;

  switch (drillType) {
    case 'movement':
      return `${positionLabel}, ${getMovementModifier(positionZone, callIndex)}`;

    case 'shot-based':
      return shot
        ? `${positionLabel}, ${shot}`
        : positionLabel;

    case 'match-sim':
      if (shot && nextPositionLabel) {
        return `${positionLabel}, ${shot}. Next, ${nextPositionLabel}`;
      }
      return shot ? `${positionLabel}, ${shot}` : positionLabel;

    case 'custom':
      return shot ? `${positionLabel}, ${shot}` : positionLabel;

    default:
      return shot ? `${positionLabel}, ${shot}` : positionLabel;
  }
}

const TEMPO_WEIGHT: Record<string, number> = { slow: 0.7, natural: 1.0, explosive: 1.4 };
const DIFF_WEIGHT:  Record<string, number> = {
  beginner: 0.5, intermediate: 0.7, advanced: 1.0, elite: 1.3, pro: 1.5,
};

// Coaching cues fire every N seconds of active training
const COACHING_INTERVAL_SECS = 90;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionEngine(db: SQLiteDatabase) {
  const store      = useSessionStore;        // static ref — access inside timeouts
  const settings = useSettingsStore((s) => s.settings);
  const getSettings = () => useSettingsStore.getState().settings ?? DEFAULT_SETTINGS;
  const { profile }   = useProfileStore();
  const progressStore = useProgressStore();

  // ── Speak helpers — always use current config's language + voiceGender ──────
  // speak(): for position calls, recovery cues, countdowns — stamps lastVoiceCallMsRef
  // so coaching cues know not to interrupt them.
  function speak(text: string) {
    lastVoiceCallMsRef.current = Date.now();
    const cfg = configRef.current;
    const s = getSettings();
    Audio.speakText(text, s.speechRate, cfg?.language ?? 'en-US', cfg?.voiceGender ?? 'female');
  }
  // speakCoach(): coaching encouragement only — does NOT stamp lastVoiceCallMsRef.
  function speakCoach(text: string) {
    const cfg = configRef.current;
    const s = getSettings();
    Audio.speakText(text, s.speechRate, cfg?.language ?? 'en-US', cfg?.voiceGender ?? 'female');
  }

  // ── Mutable refs (never cause re-renders) ──────────────────────────────────
  const engineRef          = useRef<GhostingEngine | null>(null);
  const configRef          = useRef<SessionConfig | null>(null);
  const sessionStartRef    = useRef<number>(0);
  const recoveryCueIdxRef  = useRef<number>(0);  // rotates recovery cues ("T!" / "Back to T!" / "And T!")
  const callIndexRef       = useRef<number>(0);  // rotates movement modifiers (lunge / shuffle / etc.)
  const movementsRef       = useRef<MovementRecord[]>([]);
  // Timestamp of the last position/recovery voice call — used to guard coaching cues
  // from interrupting in-progress instructions (4 s = safe margin for any TTS phrase).
  const lastVoiceCallMsRef = useRef<number>(0);

  // Timer refs
  const moveTimers   = useRef<TimerId[]>([]);
  const loopTimer    = useRef<TimerId | null>(null);
  const restTimer    = useRef<TimerId | null>(null);
  const secondTimer  = useRef<IntervalId | null>(null);
  const cpTimer      = useRef<IntervalId | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearMoveTimers() {
    moveTimers.current.forEach(clearTimeout);
    moveTimers.current = [];
    if (loopTimer.current) { clearTimeout(loopTimer.current); loopTimer.current = null; }
  }

  function clearAllTimers() {
    clearMoveTimers();
    if (restTimer.current)   { clearTimeout(restTimer.current);  restTimer.current = null; }
    if (secondTimer.current) { clearInterval(secondTimer.current); secondTimer.current = null; }
    if (cpTimer.current)     { clearInterval(cpTimer.current);   cpTimer.current = null; }
  }

  function addTimer(id: TimerId) { moveTimers.current.push(id); }

  function pushMovement(position: MovementRecord['position'], shot: string | null, setIdx: number) {
    const sessionId = store.getState().session?.sessionId ?? '';
    movementsRef.current.push({
      sessionId,
      position,
      shot,
      timestampOffsetMs: Date.now() - sessionStartRef.current,
      setIndex: setIdx,
    });
  }

  // ── Session completion ─────────────────────────────────────────────────────

  const completeSession = useCallback(async (abandoned: boolean) => {
    clearAllTimers();
    Audio.stopAudio();

    const s = store.getState().session;
    if (!s) return;

    store.getState().setState(abandoned ? 'abandoned' : 'complete');

    const ssettings = getSettings();
    if (!abandoned && ssettings.voiceEnabled) {
      speak(`Session complete. ${s.repCount} movements. Well done.`);
    }
    if (ssettings.hapticsEnabled) {
      abandoned ? Haptics.onSessionAbandoned() : Haptics.onSessionComplete();
    }

    // ── Calculate zone distribution ─────────────────────────────────────────
    const movements = movementsRef.current;
    const zoneCounts = { front: 0, mid: 0, back: 0 };
    for (const m of movements) {
      const z = POSITION_ZONE[m.position];
      if (z) zoneCounts[z]++;
    }
    const total = movements.length || 1;

    // ── Intensity score ─────────────────────────────────────────────────────
    const completion = s.totalMovementsPlanned > 0
      ? (s.repCount / s.totalMovementsPlanned) * 100 : 0;
    const intensity = Math.min(100,
      (TEMPO_WEIGHT[s.config.tempo] ?? 1) *
      (DIFF_WEIGHT[s.config.difficulty] ?? 1) *
      (completion / 100) * 100
    );

    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);

    const record: SessionRecord = {
      id: s.sessionId,
      drillType: s.config.drillType,
      courtSystem: s.config.courtSystem,
      tempo: s.config.tempo,
      difficulty: s.config.difficulty,
      durationSeconds,
      movementsTotal: s.repCount,
      movementsPlanned: s.totalMovementsPlanned,
      completionPct: Math.min(100, completion),
      intensityScore: intensity,
      zoneFrontPct: (zoneCounts.front / total) * 100,
      zoneMidPct:   (zoneCounts.mid   / total) * 100,
      zoneBackPct:  (zoneCounts.back  / total) * 100,
      startedAt: new Date(sessionStartRef.current).toISOString(),
      endedAt:   new Date().toISOString(),
      synced: false,
    };

    try {
      await saveSession(db as any, record);
      if (movements.length > 0) await saveMovements(db as any, movements);
      await deleteCheckpoint(db as any);
    } catch (e) {
      console.warn('[Session] SQLite save failed:', e);
    }

    // ── Upsert personal bests ───────────────────────────────────────────────
    try {
      const endAt = record.endedAt;
      await upsertPersonalBest(db as any, record.drillType, 'movements',  record.movementsTotal,  record.id, endAt);
      await upsertPersonalBest(db as any, record.drillType, 'completion', record.completionPct,   record.id, endAt);
      await upsertPersonalBest(db as any, record.drillType, 'intensity',  record.intensityScore,  record.id, endAt);
    } catch (e) {
      console.warn('[Session] PB upsert failed:', e);
    }

    progressStore.addSession(record);
    progressStore.markSessionCompleted();   // triggers reactive reload in Home + Progress

    // ── Badge checks ────────────────────────────────────────────────────────
    if (!abandoned) {
      const badges = useBadgesStore.getState();
      const freshStats = useProgressStore.getState().stats;

      if (freshStats.totalSessions <= 1)           badges.awardBadge('first_session');
      if (freshStats.currentStreak >= 7)           badges.awardBadge('streak_7');
      if (freshStats.totalMovements >= 100)        badges.awardBadge('movements_100');
      if (s.config.difficulty === 'elite' || s.config.difficulty === 'pro') {
        badges.awardBadge('elite_difficulty');
      }
      if (record.completionPct >= 100)             badges.awardBadge('perfect_session');
    }
  }, [db, settings]);

  // ── Rest period ────────────────────────────────────────────────────────────

  const startRest = useCallback(() => {
    const config = configRef.current;
    if (!config) return;

    clearMoveTimers();
    store.getState().setState('rest');
    store.getState().advanceSet();

    const movesPerSet = MOVES_PER_SET[config.difficulty];
    const intervalMs  = getIntervalMs(config.difficulty, config.tempo);
    const restMs = config.restMode === 'manual' && config.restSeconds > 0
      ? config.restSeconds * 1000
      : getAutoRestMs(movesPerSet, intervalMs);
    const restSecs = Math.max(1, Math.round(restMs / 1000));

    store.getState().setRestSecsRemaining(restSecs);
    const s = getSettings();
    if (s.voiceEnabled) speak('Rest');
    if (s.hapticsEnabled) Haptics.onRestStart();

    // Countdown the rest period
    function tick(remaining: number) {
      store.getState().setRestSecsRemaining(remaining);
      if (remaining <= 0) {
        store.getState().setState('active');
        const s2 = getSettings();
        if (s2.voiceEnabled) speak('Go!');
        if (s2.hapticsEnabled) Haptics.onRestEnd();
        restTimer.current = setTimeout(() => fireMoveLoop(), 400);
        return;
      }
      restTimer.current = setTimeout(() => tick(remaining - 1), 1000);
    }
    tick(restSecs);
  }, [settings]);

  // ── Core move loop ─────────────────────────────────────────────────────────

  // Declared before startActive — hoisted via useCallback
  const fireMoveLoop = useCallback(() => {
    const engine = engineRef.current;
    const config = configRef.current;
    if (!engine || !config) return;

    // Safety: only run in active state
    if (store.getState().session?.state !== 'active') return;

    const move = engine.getNextMove();
    const s    = store.getState();

    // Counters fire immediately; court and voice update together at positionCallMs.
    s.incrementRep();
    s.advanceMove();

    pushMovement(move.position, move.shot, move.setIndex);

    const isBeepMode = config.voiceMode === 'beep';

    // T+0: haptic signal — heavier in beep mode since the haptic IS the beep
    const ssettings = getSettings();
    if (ssettings.hapticsEnabled) {
      isBeepMode ? Haptics.onPositionCallBeep() : Haptics.onPositionCall();
    }

    // T+positionCallMs: court and voice update simultaneously.
    // Holding the T pose until the call fires gives the player a composed moment
    // at T before court and voice confirm the new position at the same instant.
    addTimer(setTimeout(() => {
      if (store.getState().session?.state !== 'active') return;
      s.setCurrentPosition(move.position, move.shot);
      s.setNextPosition(engine.peekNextPosition());
    }, AUDIO_OFFSETS.positionCallMs));

    if (ssettings.voiceEnabled && !isBeepMode && config.voiceMode !== 'visual-only') {
      // Voice fires 150ms before the visual update so that TTS startup latency (~150ms on iOS)
      // brings the spoken word into sync with the court highlight appearing at positionCallMs.
      addTimer(setTimeout(() => {
        if (store.getState().session?.state !== 'active') return;
        const posLabel  = getPositionLabel(move.position, config.dominantHand);
        const posInfo   = POSITION_ZONE[move.position];
        // Read directly from engine — independent of store state since we fire before setNextPosition.
        const nextPos   = engine.peekNextPosition();
        const nextLabel = nextPos ? getPositionLabel(nextPos, config.dominantHand) : null;

        const callText = buildVoiceCall({
          drillType:         config.drillType,
          positionLabel:     posLabel,
          positionZone:      posInfo ?? 'mid',
          shot:              move.shot,
          nextPositionLabel: nextLabel,
          callIndex:         callIndexRef.current++,
        });

        speak(callText);
      }, AUDIO_OFFSETS.voiceCallMs));

      // Recovery cue fires at end of movement phase for ALL drill types.
      // Signals the player to run back to T before the next position call.
      const recoveryCallMs = MOVEMENT_PHASE_MS[config.difficulty][config.tempo];
      addTimer(setTimeout(() => {
        if (store.getState().session?.state !== 'active') return;
        const recoveryCue = Audio.getRecoveryCue(recoveryCueIdxRef.current++);
        speak(recoveryCue);
      }, recoveryCallMs));

      // Clear active position T_POSE_CLEAR_DELAY_MS after recovery cue starts speaking.
      // This makes the T pose appear at full opacity while the player runs back and pauses at T.
      addTimer(setTimeout(() => {
        if (store.getState().session?.state === 'active') {
          store.getState().setCurrentPosition(null, null);
        }
      }, recoveryCallMs + T_POSE_CLEAR_DELAY_MS));
    }

    // Haptic "return to T" fires with recovery cue at end of movement phase
    const recoveryMs = MOVEMENT_PHASE_MS[config.difficulty][config.tempo];
    if (getSettings().hapticsEnabled) {
      addTimer(setTimeout(() => {
        Haptics.onReturnToT();
      }, recoveryMs));
    }

    // T+intervalMs: trigger next cycle.
    // Live pace step (0–4) offsets the interval; clamped so T-pose always clears
    // before the next call (minimum = movementPhase + 1500 ms).
    const livePaceStep  = store.getState().session?.livePaceStep ?? PACE_DEFAULT_STEP;
    const paceOffset    = PACE_STEPS_MS[livePaceStep] ?? 0;
    const extraPaceMs   = getSettings().movementPaceExtraMs ?? 0;
    const movementPhase = MOVEMENT_PHASE_MS[config.difficulty][config.tempo];
    const effectiveInterval = Math.max(movementPhase + 1500, move.intervalMs + paceOffset + extraPaceMs);
    loopTimer.current = setTimeout(() => {
      if (store.getState().session?.state !== 'active') return;

      // Check total duration
      const elapsed = store.getState().session?.elapsedSeconds ?? 0;
      if (elapsed >= config.duration * 60) {
        completeSession(false);
        return;
      }

      // Check if set complete → rest
      if (engine.isSetComplete()) {
        startRest();
        return;
      }

      fireMoveLoop();
    }, effectiveInterval);

  }, [settings, completeSession, startRest]);

  // ── Active state setup ─────────────────────────────────────────────────────

  const startActive = useCallback(() => {
    store.getState().setState('active');

    // 1-second elapsed ticker + coaching cues
    secondTimer.current = setInterval(() => {
      store.getState().tickElapsed();
      const s = store.getState().session;
      if (!s || s.state !== 'active') return;
      if (s.elapsedSeconds >= s.config.duration * 60) {
        completeSession(false);
        return;
      }

      // Mid-session coaching cues every COACHING_INTERVAL_SECS.
      // Guard: skip if a position/recovery call was spoken within the last 4 s
      // to avoid the coaching phrase interrupting an in-progress instruction.
      const s2 = getSettings();
      if (
        s2.coachingCues &&
        s2.voiceEnabled &&
        s.config.voiceMode !== 'visual-only' &&
        s.config.voiceMode !== 'beep' &&
        s.elapsedSeconds > 0 &&
        s.elapsedSeconds % COACHING_INTERVAL_SECS === 0 &&
        Date.now() - lastVoiceCallMsRef.current > 4000
      ) {
        const cueIdx = Math.floor(s.elapsedSeconds / COACHING_INTERVAL_SECS) - 1;
        speakCoach(Audio.getCoachingPhrase(cueIdx));
      }
    }, 1000);

    // 15-second checkpoint saver
    cpTimer.current = setInterval(async () => {
      const s = store.getState().session;
      if (!s) return;
      try {
        await saveCheckpoint(db as any, {
          sessionId: s.sessionId,
          config: s.config,
          setIndex: s.setIndex,
          moveIndex: s.moveIndex,
          movementsCompleted: s.repCount,
          elapsedSeconds: s.elapsedSeconds,
          savedAt: new Date().toISOString(),
        });
      } catch {}
    }, CHECKPOINT_INTERVAL_MS);

    // Pause at T before first call so the player is standing at T when the first
    // instruction fires — mirrors the T-pause that happens between every subsequent rep.
    addTimer(setTimeout(fireMoveLoop, T_START_PAUSE_MS));
  }, [db, completeSession, fireMoveLoop]);

  // ── Countdown ─────────────────────────────────────────────────────────────

  const runCountdown = useCallback((n: number) => {
    store.getState().setState('countdown');
    store.getState().setCountdown(n);

    const s = getSettings();
    if (s.hapticsEnabled) Haptics.onCountdownTick();

    if (n > 0) {
      if (s.voiceEnabled) {
        speak(String(n));
      }
      addTimer(setTimeout(() => runCountdown(n - 1), 1000));
    } else {
      // n===0 → "GO!"
      addTimer(setTimeout(() => {
        if (s.voiceEnabled) speak('Go!');
        if (s.hapticsEnabled) Haptics.onSessionStart();
        addTimer(setTimeout(startActive, 700));
      }, 300));
    }
  }, [startActive]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const startSession = useCallback(async (config: SessionConfig) => {
    // Merge user profile into config (override dominantHand, voiceGender, language)
    const fullConfig: SessionConfig = {
      ...config,
      dominantHand: profile.dominantHand,
      voiceGender: profile.voiceGender,
      language: profile.language,
    };

    configRef.current          = fullConfig;
    movementsRef.current       = [];
    recoveryCueIdxRef.current  = 0;
    callIndexRef.current       = 0;
    lastVoiceCallMsRef.current = 0;
    engineRef.current         = createGhostingEngine(fullConfig);
    sessionStartRef.current  = Date.now();

    await Audio.initAudioSession();

    const totalMoves = engineRef.current.estimatedTotalMoves();
    store.getState().initSession(fullConfig, totalMoves);

    // Announce "Move to the T" before countdown numbers begin
    const sForStart = getSettings();
    if (sForStart.voiceEnabled && fullConfig.voiceMode !== 'beep' && fullConfig.voiceMode !== 'visual-only') {
      Audio.speakText('Move to the T', sForStart.speechRate, fullConfig.language, fullConfig.voiceGender);
      addTimer(setTimeout(() => runCountdown(COUNTDOWN_SECONDS), 2500));
    } else {
      runCountdown(COUNTDOWN_SECONDS);
    }
  }, [profile, runCountdown]);

  const pauseSession = useCallback(() => {
    if (store.getState().session?.state !== 'active') return;
    clearMoveTimers();
    if (restTimer.current) { clearTimeout(restTimer.current); restTimer.current = null; }
    Audio.stopAudio();
    store.getState().setState('paused');
  }, []);

  const resumeSession = useCallback(() => {
    if (store.getState().session?.state !== 'paused') return;
    store.getState().setState('active');
    fireMoveLoop();
  }, [fireMoveLoop]);

  const skipRest = useCallback(() => {
    if (restTimer.current) { clearTimeout(restTimer.current); restTimer.current = null; }
    store.getState().setState('active');
    const s = getSettings();
    if (s.voiceEnabled) speak('Go!');
    if (s.hapticsEnabled) Haptics.onRestEnd();
    setTimeout(fireMoveLoop, 300);
  }, [fireMoveLoop]);

  const endSession = useCallback(() => {
    completeSession(true);
  }, [completeSession]);

  const dismissSession = useCallback(() => {
    clearAllTimers();
    Audio.stopAudio();
    store.getState().endSession();
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearAllTimers();
      Audio.stopAudio();
    };
  }, []);

  return {
    startSession,
    pauseSession,
    resumeSession,
    skipRest,
    endSession,
    dismissSession,
  };
}
