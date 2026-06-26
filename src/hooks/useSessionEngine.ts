import { useRef, useCallback, useEffect } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';

import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore, DEFAULT_SETTINGS } from '../stores/settingsStore';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';

import { createGhostingEngine, type GhostingEngine } from '../engine/ghostingEngine';
import * as Audio from '../engine/audioEngine';
import * as Haptics from '../engine/hapticsEngine';

import { SessionConfig, SessionRecord, MovementRecord, ProgressStats } from '../types';
import {
  getPositionLabel, POSITION_ZONE, POSITION_INFO,
} from '../constants/positions';
import {
  AUDIO_OFFSETS, MOVEMENT_PHASE_MS, MOVES_PER_SET, getIntervalMs,
  getAutoRestMs, CHECKPOINT_INTERVAL_MS, COUNTDOWN_SECONDS,
  T_POSE_CLEAR_DELAY_MS, T_START_PAUSE_MS, PACE_STEPS_MS, PACE_DEFAULT_STEP,
  estimateTotalMoves,
} from '../constants/timing';
import {
  saveSession, saveMovements, saveCheckpoint, deleteCheckpoint, upsertPersonalBest,
  getProgressStats,
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
  back:  ['sprint back', 'full stretch', 'push back'],
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
      // BUG-026: T position shots need context — player is already there, no movement required.
      if (positionLabel === 'the T' && shot) return `From the T, ${shot}`;
      return shot ? `${positionLabel}, ${shot}` : positionLabel;

    case 'match-sim':
      // BUG-013: do NOT pre-announce next position — match-sim should feel like a real rally
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
// Ceiling for intensity normalization: pro + explosive = 1.5 × 1.4 = 2.1
// Dividing by this makes the full 0-100 scale usable instead of clamping at ~48% completion for pro.
const INTENSITY_MAX = 1.5 * 1.4;

// Coaching cues fire every N seconds of active training
const COACHING_INTERVAL_SECS = 90;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionEngine(db: SQLiteDatabase) {
  const store      = useSessionStore;        // static ref — access inside timeouts
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
  // BUG-030: track last coaching cue elapsed time to avoid modulo miss on pause/resume
  const lastCoachingCueSecsRef = useRef<number>(-COACHING_INTERVAL_SECS);

  // Timer refs
  const moveTimers      = useRef<TimerId[]>([]);
  const loopTimer       = useRef<TimerId | null>(null);
  const restTimer       = useRef<TimerId | null>(null);
  const secondTimer     = useRef<IntervalId | null>(null);
  const cpTimer         = useRef<IntervalId | null>(null);
  const isCompletingRef = useRef(false);

  // Tracks when the current move cycle started — used to reschedule loopTimer on live pace change
  const cycleStartRef     = useRef<number>(0);
  // Always-current ref to fireMoveLoop so the pace subscription can call it without stale closure
  const fireMoveLoopRef   = useRef<() => void>(() => {});

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
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    clearAllTimers();
    Audio.stopAudio();
    // Return to T pose — clearAllTimers() may cancel a pending T-pose clear timer,
    // and secondTimer can fire completeSession while currentPosition is still active.
    store.getState().setCurrentPosition(null, null);

    const s = store.getState().session;
    if (!s) { isCompletingRef.current = false; return; }

    store.getState().setState(abandoned ? 'abandoned' : 'complete');

    const ssettings = getSettings();
    if (!abandoned && ssettings.voiceEnabled) {
      speak(`Back to T. Session complete. ${s.repCount} movements. Well done.`);
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
      (completion / 100) *
      (100 / INTENSITY_MAX)
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
      if (!abandoned) {
        Alert.alert(
          'Session not saved',
          'Your session completed but could not be saved due to a storage error. Your progress for this session will not appear in your history.',
          [{ text: 'OK' }],
        );
      }
    }

    // ── Upsert personal bests (completed sessions only) ────────────────────
    if (!abandoned) {
      try {
        const endAt = record.endedAt;
        const isMovementsPB = await upsertPersonalBest(db as any, record.drillType, 'movements',  record.movementsTotal,  record.id, endAt);
        await upsertPersonalBest(db as any, record.drillType, 'completion', record.completionPct,   record.id, endAt);
        await upsertPersonalBest(db as any, record.drillType, 'intensity',  record.intensityScore,  record.id, endAt);
        if (isMovementsPB) progressStore.setNewPBFlag(record.id);
      } catch (e) {
        console.warn('[Session] PB upsert failed:', e);
      }
    }

    // Query fresh stats from DB so badge checks see the just-saved session
    let freshStats: ProgressStats | null = null;
    if (!abandoned) {
      try { freshStats = await getProgressStats(db as any); } catch {}
    }

    progressStore.addSession(record);
    progressStore.markSessionCompleted();   // triggers reactive reload in Home + Progress
    progressStore.setLastSessionConfig(s.config); // Quick Start replays exact config next time

    // ── Badge checks ────────────────────────────────────────────────────────
    if (!abandoned && freshStats) {
      const badges = useBadgesStore.getState();

      if (freshStats.totalSessions <= 1)           badges.awardBadge('first_session');
      if (freshStats.currentStreak >= 7)           badges.awardBadge('streak_7');
      if (freshStats.totalMovements >= 100)        badges.awardBadge('movements_100');
      if (s.config.difficulty === 'elite' || s.config.difficulty === 'pro') {
        badges.awardBadge('elite_difficulty');
      }
      if (record.completionPct >= 100)             badges.awardBadge('perfect_session');
      // justEarned is populated inside awardBadge only when a badge is newly earned.
    }

    isCompletingRef.current = false;
  }, [db]);

  // ── Rest period ────────────────────────────────────────────────────────────

  const startRest = useCallback(() => {
    const config = configRef.current;
    if (!config) return;

    clearMoveTimers();
    // Reset to T pose immediately — clearMoveTimers() may cancel the T-pose clear
    // timeout before it fires, leaving currentPosition stuck on the last position.
    store.getState().setCurrentPosition(null, null);

    // BUG-005: restMode 'none' means skip rest entirely — go straight to next set.
    if (config.restMode === 'none') {
      store.getState().advanceSet();
      fireMoveLoop();
      return;
    }

    store.getState().setState('rest');
    store.getState().advanceSet();

    const movesPerSet = MOVES_PER_SET[config.difficulty];
    const intervalMs  = getIntervalMs(config.difficulty, config.tempo);
    const restMs = config.restMode === 'manual' && config.restSeconds > 0
      ? config.restSeconds * 1000
      : getAutoRestMs(config.difficulty, movesPerSet, intervalMs);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core move loop ─────────────────────────────────────────────────────────

  // Declared before startActive — hoisted via useCallback
  const fireMoveLoop = useCallback(() => {
    const engine = engineRef.current;
    const config = configRef.current;
    if (!engine || !config) return;

    // Safety: only run in active state
    if (store.getState().session?.state !== 'active') return;

    // Mark when this cycle started so the pace-change subscription can compute remaining time
    cycleStartRef.current = Date.now();

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

    // Pre-compute effective interval here so T-pose clear can clamp against it (BUG-006)
    const livePaceStep    = store.getState().session?.livePaceStep ?? PACE_DEFAULT_STEP;
    const paceOffset      = PACE_STEPS_MS[livePaceStep] ?? 0;
    const movementPhase   = MOVEMENT_PHASE_MS[config.difficulty][config.tempo];
    // Floor includes phaseOffsetMs so the gap between the recovery cue and the next
    // position call is consistent across all positions (front corners no longer feel rushed
    // vs mid/back positions at fast pace).
    const effectiveIntervalMs = Math.max(movementPhase + move.phaseOffsetMs + 400, move.intervalMs + paceOffset);

    // T+positionCallMs: court and voice update simultaneously.
    // BUG-007: skip visual update in voice-only mode (voice-only = no court highlight).
    addTimer(setTimeout(() => {
      if (store.getState().session?.state !== 'active') return;
      if (config.voiceMode !== 'voice-only') {
        s.setCurrentPosition(move.position, move.shot);
        s.setNextPosition(engine.peekNextPosition());
      }
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

      // Recovery cue: skip when position IS the T, or when the gap between the cue and the
      // next call is too tight to complete the utterance. Threshold scales with interval so
      // faster pace doesn't skip the cue disproportionately vs slower settings.
      const recoveryCallMs  = MOVEMENT_PHASE_MS[config.difficulty][config.tempo] + move.phaseOffsetMs;
      const gapAfterCue     = effectiveIntervalMs - recoveryCallMs;
      const skipThresholdMs = Math.max(600, effectiveIntervalMs * 0.22);
      const skipRecoveryCue = move.position === 'T' || gapAfterCue < skipThresholdMs;
      if (!skipRecoveryCue) {
        addTimer(setTimeout(() => {
          if (store.getState().session?.state !== 'active') return;
          const recoveryCue = Audio.getRecoveryCue(recoveryCueIdxRef.current++);
          speak(recoveryCue);
        }, recoveryCallMs));
      }
    }

    // T-pose clear fires in ALL voiceModes (voice+visual, voice-only, visual-only, beep).
    // BUG-006: clamp so clear always fires before the next cycle starts.
    // phaseOffsetMs shifts the clear point for front corners in sync with the recovery cue.
    const tPoseClearMs = Math.min(
      movementPhase + move.phaseOffsetMs + T_POSE_CLEAR_DELAY_MS,
      effectiveIntervalMs - 100,
    );
    addTimer(setTimeout(() => {
      if (store.getState().session?.state === 'active') {
        store.getState().setCurrentPosition(null, null);
      }
    }, tPoseClearMs));

    // Haptic "return to T" fires with recovery cue — shifted by phaseOffsetMs for front corners.
    const recoveryMs = MOVEMENT_PHASE_MS[config.difficulty][config.tempo] + move.phaseOffsetMs;
    if (getSettings().hapticsEnabled) {
      addTimer(setTimeout(() => {
        Haptics.onReturnToT();
      }, recoveryMs));
    }

    // T+intervalMs: trigger next cycle using pre-computed effectiveIntervalMs.
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
    }, effectiveIntervalMs);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeSession, startRest]);

  // Keep ref current so the pace subscription below can always call the latest fireMoveLoop
  fireMoveLoopRef.current = fireMoveLoop;

  // ── Live pace change — immediate reschedule ────────────────────────────────
  // When the user presses +/− mid-cycle, cancel the already-scheduled loopTimer and
  // reschedule it with the remaining time adjusted for the new pace.  Without this,
  // the change only takes effect after the current cycle's timer expires (up to 10 s
  // at beginner/slow), which feels like the button is broken.
  useEffect(() => {
    let prevStep: number | undefined;
    return useSessionStore.subscribe((newState) => {
      const step = newState.session?.livePaceStep;
      if (step === undefined || step === prevStep) return;
      prevStep = step;

      if (newState.session?.state !== 'active') return;
      if (!loopTimer.current) return;

      const config = configRef.current;
      if (!config) return;

      const paceOffset    = PACE_STEPS_MS[step] ?? 0;
      const movementPhase = MOVEMENT_PHASE_MS[config.difficulty][config.tempo];
      const baseInterval  = getIntervalMs(config.difficulty, config.tempo);
      const newInterval   = Math.max(movementPhase + 400, baseInterval + paceOffset);

      const elapsed   = Date.now() - cycleStartRef.current;
      const remaining = Math.max(100, newInterval - elapsed);

      clearTimeout(loopTimer.current!);
      loopTimer.current = setTimeout(fireMoveLoopRef.current, remaining);
    });
  }, []);

  // ── Active state setup ─────────────────────────────────────────────────────

  // BUG-001: isResume=true skips the T_START_PAUSE_MS delay (no 3-second dead time on resume)
  const startActive = useCallback((isResume = false) => {
    store.getState().setState('active');

    // BUG-002: Restore checkpoint data including the original sessionId so the resumed
    // session continues under the same DB record rather than creating a new one.
    const resume = store.getState().resumeFromCheckpoint;
    if (resume) {
      store.getState().setElapsedSeconds(resume.elapsedSeconds);
      store.getState().setRepCount(resume.repCount);
      // Shift the session start time so elapsed calc stays correct
      sessionStartRef.current = Date.now() - resume.elapsedSeconds * 1000;
      if (resume.sessionId) store.getState().setSessionId(resume.sessionId);
      // Seek engine to the checkpointed set so match-sim speed progression and
      // set count are correct (engine can't restore exact positions since they're random).
      if (engineRef.current && typeof resume.setIndex === 'number' && resume.setIndex > 0) {
        engineRef.current.seekToSet(resume.setIndex);
      }
      store.getState().setResumeFromCheckpoint(null);
    }

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
      // BUG-030: use elapsed-time delta instead of modulo so cues never miss on pause/resume
      if (
        s2.coachingCues &&
        s2.voiceEnabled &&
        s.config.voiceMode !== 'visual-only' &&
        s.config.voiceMode !== 'beep' &&
        s.elapsedSeconds > 0 &&
        s.elapsedSeconds - lastCoachingCueSecsRef.current >= COACHING_INTERVAL_SECS &&
        Date.now() - lastVoiceCallMsRef.current > 4000
      ) {
        lastCoachingCueSecsRef.current = s.elapsedSeconds;
        const cueIdx = Math.floor(s.elapsedSeconds / COACHING_INTERVAL_SECS) - 1;
        speakCoach(Audio.getCoachingPhrase(cueIdx));
      }
    }, 1000);

    // Save checkpoint immediately so a resume prompt is available from the very first second.
    const s0 = store.getState().session;
    if (s0) {
      saveCheckpoint(db as any, {
        sessionId: s0.sessionId,
        config: s0.config,
        setIndex: s0.setIndex,
        moveIndex: s0.moveIndex,
        movementsCompleted: s0.repCount,
        elapsedSeconds: s0.elapsedSeconds,
        savedAt: new Date().toISOString(),
      }).catch(() => {});
    }

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

    // Pause at T before first call. On resume, use a short 300ms delay instead of the
    // full T_START_PAUSE_MS — the player is already at T, no need to wait 3 seconds.
    addTimer(setTimeout(fireMoveLoop, isResume ? 300 : T_START_PAUSE_MS));
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
        addTimer(setTimeout(() => startActive(false), 700));
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

    configRef.current                = fullConfig;
    movementsRef.current             = [];
    recoveryCueIdxRef.current        = 0;
    callIndexRef.current             = 0;
    lastVoiceCallMsRef.current       = 0;
    lastCoachingCueSecsRef.current   = -COACHING_INTERVAL_SECS;  // BUG-030
    isCompletingRef.current          = false;
    engineRef.current         = createGhostingEngine(fullConfig);
    sessionStartRef.current  = Date.now();

    await Audio.initAudioSession();

    // One-time Android hint: TTS uses the media volume stream.
    if (Platform.OS === 'android') {
      const profState = useProfileStore.getState();
      if (!profState.hasShownAndroidVolumeHint && getSettings().voiceEnabled) {
        profState.markAndroidVolumeHintShown();
        Alert.alert(
          'Volume tip',
          "Voice calls use your media volume. If calls are too quiet, press the volume-up button on your device while training.",
          [{ text: 'Got it' }],
        );
      }
    }

    const ssettings = getSettings();
    const defaultPaceStep = ssettings.defaultPaceStep ?? 3;
    const totalMoves = estimateTotalMoves(
      fullConfig.duration,
      fullConfig.difficulty,
      fullConfig.tempo,
      PACE_STEPS_MS[defaultPaceStep] ?? 0,
    );
    store.getState().initSession(fullConfig, totalMoves, defaultPaceStep);
    useProfileStore.getState().markSessionStarted();

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
    const state = store.getState().session?.state;
    if (state !== 'active' && state !== 'countdown' && state !== 'rest') return;
    clearAllTimers();   // stops move loop + secondTimer + cpTimer + restTimer
    Audio.stopAudio();
    store.getState().setState('paused');
  }, []);

  const resumeSession = useCallback(() => {
    if (store.getState().session?.state !== 'paused') return;
    // BUG-001: clear ALL timers (incl. any lingering restTimer) before resuming to prevent
    // both the rest countdown and the move loop from firing simultaneously.
    clearAllTimers();
    Audio.stopAudio();
    startActive(true);  // isResume=true skips the 3-second T-start pause
  }, [startActive]);

  const skipRest = useCallback(() => {
    if (restTimer.current) { clearTimeout(restTimer.current); restTimer.current = null; }
    store.getState().setState('active');
    const s = getSettings();
    if (s.voiceEnabled) speak('Go!');
    if (s.hapticsEnabled) Haptics.onRestEnd();
    addTimer(setTimeout(fireMoveLoop, 300));
  }, [fireMoveLoop]);

  const endSession = useCallback(() => {
    completeSession(true);
  }, [completeSession]);

  const dismissSession = useCallback(() => {
    clearAllTimers();
    Audio.stopAudio();
    progressStore.setNewPBFlag(null);
    store.getState().endSession();
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearAllTimers();
      Audio.stopAudio();
    };
  }, []);

  // Audio session management across foreground/background transitions.
  // The app is designed to keep running in the background — player may lock the screen
  // and use Bluetooth, speaker, or headphones on court.
  // iOS: UIBackgroundModes:audio + shouldPlayInBackground:true allows continued execution
  //      as long as the audio session remains active (each TTS call re-asserts it).
  // Android: FOREGROUND_SERVICE_MEDIA_PLAYBACK permission keeps TTS audio running.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // Re-init audio in case it was interrupted (phone call, Siri, system sound)
        Audio.initAudioSession().catch(() => {});
      } else if (nextState === 'background') {
        // Re-assert audio session so the OS keeps the process alive via the audio background mode.
        // Do NOT pause — the session must continue with screen locked / phone in pocket.
        Audio.initAudioSession().catch(() => {});
      }
      // 'inactive' (iOS only — Control Centre, notification shade): transient, no action needed.
    });
    return () => sub.remove();
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
