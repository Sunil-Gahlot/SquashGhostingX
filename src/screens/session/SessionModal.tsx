import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, AppState, AppStateStatus,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius, ButtonHeight } from '../../constants/layout';
import { CourtCanvas } from '../../components/court';
import { useSessionStore } from '../../stores/sessionStore';
import { useProgressStore } from '../../stores/progressStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProfileStore } from '../../stores/profileStore';
import { useBadgesStore, BADGE_DEFS } from '../../stores/badgesStore';
import { useSessionEngine } from '../../hooks/useSessionEngine';
import { ActiveSession, Difficulty } from '../../types';
import { POSITION_INFO } from '../../constants/positions';
import { PACE_STEPS_MS, PACE_STEP_LABELS, MOVES_PER_SET, getIntervalMs, AUTO_REST_FACTORS } from '../../constants/timing';

// ─── CountdownView ────────────────────────────────────────────────────────────

function CountdownView({ session }: { session: ActiveSession }) {
  const scale   = useRef(new Animated.Value(0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.setValue(0.65);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [session.countdownValue]);

  const isGo    = session.countdownValue === 0;
  const display = isGo ? 'GO!' : String(session.countdownValue);

  return (
    <View style={cdStyles.container}>
      <Text style={cdStyles.caption}>GET READY</Text>
      <Animated.View style={[cdStyles.circle, { transform: [{ scale }], opacity }]}>
        <Text style={[cdStyles.number, isGo && cdStyles.numberGo]}>{display}</Text>
      </Animated.View>
      <Text style={cdStyles.instruction}>Move to the T</Text>
      <Text style={cdStyles.drillInfo}>
        {session.config.drillType.replace('-', ' ')} · {session.config.courtSystem.toUpperCase()} · {session.config.difficulty}
      </Text>
    </View>
  );
}

const cdStyles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.brand, gap: Spacing.xl,
  },
  caption: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.70)', letterSpacing: 5,
  },
  circle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  number:      { fontSize: 92, fontWeight: FontWeight.black, color: Colors.textPrimary, lineHeight: 100 },
  numberGo:    { fontSize: 64 },
  instruction: { fontSize: FontSize.body, color: 'rgba(255,255,255,0.80)', fontWeight: FontWeight.medium },
  drillInfo:   {
    fontSize: FontSize.caption, color: 'rgba(255,255,255,0.55)',
    textTransform: 'capitalize', letterSpacing: 0.5,
  },
});

// ─── ActiveTrainingView ───────────────────────────────────────────────────────

const PACE_STEP_COUNT = PACE_STEPS_MS.length; // 7

function fmtLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ActiveTrainingView({
  session, onPause, onEnd, courtMode, gender,
}: {
  session: ActiveSession;
  onPause: () => void;
  onEnd:   () => void;
  courtMode: 'glass' | 'wooden';
  gender: string | null;
}) {
  const setPaceStep = useSessionStore((s) => s.setPaceStep);
  const paceStep    = session.livePaceStep;

  const elapsed   = session.elapsedSeconds;
  const total     = session.config.duration * 60;
  const remaining = Math.max(0, total - elapsed);
  const rmm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const rss = String(remaining % 60).padStart(2, '0');

  const diffLabel = session.config.difficulty.charAt(0).toUpperCase() + session.config.difficulty.slice(1);

  return (
    <View style={atStyles.container}>
      {/* ── Top: Timer (left) + Rep count (center) + Difficulty badge (right) */}
      <View style={atStyles.topBar}>
        <View style={atStyles.timerWrap}>
          <View style={atStyles.timerCircle}>
            <Ionicons name="timer-outline" size={16} color={Colors.brand} />
          </View>
          <View>
            <Text style={atStyles.timerVal}>{rmm}:{rss}</Text>
            <Text style={atStyles.timerSub}>remaining</Text>
          </View>
        </View>
        <View style={atStyles.repWrap}>
          <Text style={atStyles.repVal}>{session.repCount}</Text>
          <Text style={atStyles.repSub}>reps</Text>
        </View>
        <View style={atStyles.diffBadge}>
          <Text style={atStyles.diffBadgeText}>{diffLabel}</Text>
        </View>
      </View>

      {/* ── Drill metadata bar (static) ───────────────────────────── */}
      <View style={atStyles.metaBar}>
        <Text style={atStyles.metaText}>
          {fmtLabel(session.config.drillType)}  ·  {session.config.courtSystem.toUpperCase()}  ·  {fmtLabel(session.config.patternType)}
        </Text>
      </View>

      {/* ── Court (fills remaining space) ─────────────────────────── */}
      <CourtCanvas
        activePosition={session.currentPosition}
        courtSystem={session.config.courtSystem}
        dominantHand={session.config.dominantHand}
        gender={gender}
        courtMode={courtMode}
        style={atStyles.court}
      />

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <View style={atStyles.progressWrap}>
        <View style={atStyles.progressBg}>
          <View style={[atStyles.progressFill, { width: `${Math.min(100, Math.round((elapsed / total) * 100))}%` }]} />
        </View>
      </View>

      {/* ── Live pace control ─────────────────────────────────────── */}
      <View style={atStyles.paceWrap}>
        <Text style={atStyles.paceHeader}>
          PACE  ·  <Text style={atStyles.paceLevelName}>{PACE_STEP_LABELS[paceStep]}</Text>
        </Text>
        <View style={atStyles.paceRow}>
          <TouchableOpacity
            onPress={() => setPaceStep(paceStep - 1)}
            disabled={paceStep === 0}
            style={[atStyles.paceBtn, paceStep === 0 && atStyles.paceBtnDisabled]}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[atStyles.paceBtnText, paceStep === 0 && atStyles.paceBtnTextDisabled]}>−</Text>
          </TouchableOpacity>

          <View style={atStyles.paceDots}>
            {Array.from({ length: PACE_STEP_COUNT }, (_, i) => (
              <View key={i} style={[atStyles.paceDot, i === paceStep && atStyles.paceDotActive]} />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setPaceStep(paceStep + 1)}
            disabled={paceStep === PACE_STEP_COUNT - 1}
            style={[atStyles.paceBtn, paceStep === PACE_STEP_COUNT - 1 && atStyles.paceBtnDisabled]}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[atStyles.paceBtnText, paceStep === PACE_STEP_COUNT - 1 && atStyles.paceBtnTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── END | PAUSE buttons ───────────────────────────────────── */}
      <View style={atStyles.controls}>
        <TouchableOpacity onPress={onEnd} style={[atStyles.btn, atStyles.btnEnd]} activeOpacity={0.82}>
          <Text style={atStyles.btnEndText}>END</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPause} style={[atStyles.btn, atStyles.btnPause]} activeOpacity={0.82}>
          <Ionicons name="pause" size={16} color={Colors.textPrimary} />
          <Text style={atStyles.btnPauseText}>PAUSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const atStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  timerWrap:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timerCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  timerVal:  { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 26 },
  timerSub:  { fontSize: FontSize.micro, color: Colors.textMuted },
  repWrap:   { alignItems: 'center' },
  repVal:    { fontSize: FontSize.title, fontWeight: FontWeight.black, color: Colors.accentProgress, lineHeight: 26 },
  repSub:    { fontSize: FontSize.micro, color: Colors.textMuted, textAlign: 'center' },
  diffBadge: {
    backgroundColor: Colors.accentProgress,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  diffBadgeText: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Drill metadata bar (static — replaces dynamic callCard)
  metaBar: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
  },
  metaText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Court
  court: { flex: 1, marginHorizontal: Spacing.base, borderRadius: BorderRadius.lg, overflow: 'hidden' },

  // Progress
  progressWrap: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  progressBg:   { height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.brand, borderRadius: 2 },

  // Live pace control
  paceWrap: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  paceTip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    alignSelf: 'stretch',
    backgroundColor: `${Colors.brand}14`,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: `${Colors.brand}35`,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    marginBottom: 2,
  },
  paceTipText: { flex: 1, fontSize: FontSize.caption, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  paceHeader: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  paceLevelName: {
    color: Colors.brand,
    fontWeight: FontWeight.black,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  paceBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  paceBtnDisabled: { borderColor: Colors.surfaceElevated, backgroundColor: Colors.background },
  paceBtnText:     { fontSize: 24, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 28 },
  paceBtnTextDisabled: { color: Colors.textMuted },
  paceDots: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  paceDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  paceDotActive: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },

  // Controls
  controls: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl, paddingTop: Spacing.xs,
  },
  btn:    { flex: 1, height: ButtonHeight.md, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnEnd: { backgroundColor: Colors.background, borderWidth: 2, borderColor: Colors.danger },
  btnPause: { backgroundColor: Colors.surface },
  btnEndText:   { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.danger, letterSpacing: 1 },
  btnPauseText: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 1 },
});

// ─── PausedView ───────────────────────────────────────────────────────────────

function PausedView({
  session, onResume, onEnd, courtMode, gender,
}: {
  session: ActiveSession;
  onResume: () => void;
  onEnd:    () => void;
  courtMode: 'glass' | 'wooden';
  gender: string | null;
}) {
  const em = String(Math.floor(session.elapsedSeconds / 60)).padStart(2, '0');
  const es = String(session.elapsedSeconds % 60).padStart(2, '0');
  return (
    <View style={pvStyles.container}>
      <Text style={pvStyles.title}>Paused</Text>
      <View style={pvStyles.statsRow}>
        <Text style={pvStyles.reps}>{session.repCount} reps</Text>
        <Text style={pvStyles.statSep}>·</Text>
        <Text style={pvStyles.elapsed}>{em}:{es} elapsed</Text>
      </View>
      <CourtCanvas
        activePosition={session.currentPosition}
        courtSystem={session.config.courtSystem}
        dominantHand={session.config.dominantHand}
        gender={gender}
        courtMode={courtMode}
        style={pvStyles.court}

      />
      <View style={pvStyles.actions}>
        <TouchableOpacity onPress={onResume} style={[pvStyles.btn, pvStyles.btnPrimary]}>
          <Text style={pvStyles.btnText}>▶  Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEnd} style={[pvStyles.btn, pvStyles.btnDanger]}>
          <Text style={pvStyles.btnText}>✕  End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pvStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xl },
  title:     { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statsRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reps:      { fontSize: FontSize.body, color: Colors.textMuted },
  statSep:   { fontSize: FontSize.body, color: Colors.textDisabled },
  elapsed:   { fontSize: FontSize.body, color: Colors.brand, fontWeight: FontWeight.medium },
  court:     { width: '80%', aspectRatio: 640 / 975 },
  actions:   { width: '100%', gap: Spacing.md },
  btn:       { width: '100%', height: ButtonHeight.lg, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:{ backgroundColor: Colors.brand },
  btnDanger: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.danger },
  btnText:   { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});

// ─── RestView ─────────────────────────────────────────────────────────────────

function RestView({ session, onSkip, courtMode, gender }: { session: ActiveSession; onSkip: () => void; courtMode: 'glass' | 'wooden'; gender: string | null }) {
  return (
    <View style={rvStyles.container}>
      <Text style={rvStyles.label}>REST</Text>
      <Text style={rvStyles.countdown}>{session.restSecsRemaining}</Text>
      <CourtCanvas
        activePosition={null}
        courtSystem={session.config.courtSystem}
        dominantHand={session.config.dominantHand}
        gender={gender}
        courtMode={courtMode}
        style={rvStyles.court}
      />
      <Text style={rvStyles.nextLabel}>
        {session.nextPosition
          ? `Next: ${POSITION_INFO[session.nextPosition]?.label ?? ''}`
          : 'Prepare for next set'}
      </Text>
      <TouchableOpacity onPress={onSkip} style={rvStyles.skipBtn} activeOpacity={0.8}>
        <Text style={rvStyles.skipText}>Skip Rest  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const rvStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  label:     { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.rest, letterSpacing: 3 },
  countdown: { fontSize: 96, fontWeight: FontWeight.black, color: Colors.rest, lineHeight: 104 },
  court:     { width: '70%', aspectRatio: 640 / 975, opacity: 0.5 },
  nextLabel: { fontSize: FontSize.label, color: Colors.textMuted },
  skipBtn:   {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.primary,
  },
  skipText:  { fontSize: FontSize.body, color: Colors.primary, fontWeight: FontWeight.semiBold },
});

// ─── SessionSummaryView ───────────────────────────────────────────────────────

function SummaryStatCard({
  icon, iconBg, iconColor, value, label,
}: { icon: string; iconBg: string; iconColor: string; value: string; label: string }) {
  return (
    <View style={ssStyles.statCard}>
      <View style={[ssStyles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[ssStyles.statVal, { color: iconColor }]}>{value}</Text>
      <Text style={ssStyles.statLbl}>{label}</Text>
    </View>
  );
}

function SessionSummaryView({
  session, onDone, onAgain,
}: {
  session: ActiveSession;
  onDone:  () => void;
  onAgain: () => void;
}) {
  const { stats, newPBSessionId, recentSessions } = useProgressStore();
  const { justEarned, clearJustEarned } = useBadgesStore();

  const durationSecs = session.elapsedSeconds;
  const mm = String(Math.floor(durationSecs / 60)).padStart(2, '0');
  const ss = String(durationSecs % 60).padStart(2, '0');

  const completion  = session.totalMovementsPlanned > 0
    ? Math.round((session.repCount / session.totalMovementsPlanned) * 100) : 0;

  // BUG-018: include partial set so "0 sets" never shows for a completed session.
  const setsCompleted = session.setIndex + (session.moveIndex > 0 ? 1 : 0);

  // BUG-019: rep rate should reflect movement tempo, not total time (which includes rest).
  // Estimate active work time by subtracting rest periods.
  const cfg = session.config;
  const restPerSetSecs = cfg.restMode === 'none' ? 0 :
    cfg.restMode === 'manual' ? cfg.restSeconds :
    Math.round(MOVES_PER_SET[cfg.difficulty] * getIntervalMs(cfg.difficulty, cfg.tempo) * AUTO_REST_FACTORS[cfg.difficulty] / 1000);
  const totalRestSecs   = session.setIndex * restPerSetSecs;
  const activeTimeSecs  = Math.max(1, durationSecs - totalRestSecs);
  const avgReact = session.repCount > 0 ? (activeTimeSecs / session.repCount).toFixed(1) : '—';

  // BUG-020: calories should scale with difficulty (higher difficulty = more intense = more calories).
  const calPerRep: Record<Difficulty, number> = {
    beginner: 1.2, intermediate: 1.8, advanced: 2.4, elite: 3.0, pro: 3.6,
  };
  const calories = Math.round(session.repCount * (calPerRep[cfg.difficulty] ?? 1.8));

  const isNewPB = newPBSessionId === session.sessionId;

  const DIFFICULTY_NEXT: Record<string, string> = {
    beginner: 'intermediate', intermediate: 'advanced', advanced: 'elite', elite: 'pro',
  };
  const nextDiff  = DIFFICULTY_NEXT[session.config.difficulty];
  const sameLevel = recentSessions.filter((s) => s.difficulty === session.config.difficulty).slice(0, 3);
  const showNudge = !!nextDiff && sameLevel.length >= 3 && sameLevel.every((s) => s.completionPct >= 88);

  const wasComplete = session.state === 'complete';

  return (
    <ScrollView contentContainerStyle={ssStyles.container} showsVerticalScrollIndicator={false}>

      {/* Trophy circle */}
      <View style={[ssStyles.trophyCircle, wasComplete ? ssStyles.trophyComplete : ssStyles.trophyEnded]}>
        <Ionicons
          name="trophy"
          size={32}
          color={wasComplete ? Colors.brand : Colors.textMuted}
        />
      </View>

      {/* Headline */}
      <Text style={ssStyles.headline}>
        {wasComplete ? 'Session Complete!' : 'Session Ended'}
      </Text>
      <Text style={ssStyles.subline}>
        {wasComplete ? 'Great effort. Keep the streak going.' : 'Good work. Every session counts.'}
      </Text>
      {wasComplete && (
        <View style={ssStyles.savedRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          <Text style={ssStyles.savedText}>Session saved</Text>
        </View>
      )}

      {/* PB banner */}
      {isNewPB && (
        <View style={ssStyles.pbBanner}>
          <Ionicons name="star" size={14} color={Colors.gold} />
          <Text style={ssStyles.pbText}>New Personal Best!</Text>
        </View>
      )}

      {/* Badge unlocks */}
      {justEarned.length > 0 && (
        <View style={ssStyles.badgeUnlockWrap}>
          <View style={ssStyles.badgeUnlockLabelRow}>
            <Ionicons name="medal" size={12} color={Colors.gold} />
            <Text style={ssStyles.badgeUnlockLabel}>
              BADGE{justEarned.length > 1 ? 'S' : ''} UNLOCKED
            </Text>
          </View>
          {justEarned.map((id) => {
            const def = BADGE_DEFS.find((b) => b.id === id);
            if (!def) return null;
            return (
              <View key={id} style={ssStyles.badgeUnlockRow}>
                <View style={[ssStyles.badgeUnlockIcon, { backgroundColor: `${def.color}22`, borderColor: `${def.color}55` }]}>
                  <Ionicons name={def.icon as any} size={20} color={def.color} />
                </View>
                <View>
                  <Text style={[ssStyles.badgeUnlockName, { color: def.color }]}>{def.label}</Text>
                  <Text style={ssStyles.badgeUnlockDesc}>{def.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 2×3 stat card grid — matches ref16 exactly */}
      <View style={ssStyles.statGrid}>
        <SummaryStatCard
          icon="timer" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
          value={`${mm}:${ss}`} label="Duration"
        />
        <SummaryStatCard
          icon="walk" iconBg={`${Colors.accentRoutines}22`} iconColor={Colors.accentRoutines}
          value={String(session.repCount)} label="Movements"
        />
        <SummaryStatCard
          icon="flash" iconBg={Colors.brandMuted} iconColor={Colors.brand}
          value={`${avgReact}s`} label="Rep Speed"
        />
        <SummaryStatCard
          icon="repeat" iconBg={`${Colors.accentLibrary}22`} iconColor={Colors.accentLibrary}
          value={String(setsCompleted)} label="Sets"
        />
        <SummaryStatCard
          icon="bar-chart" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
          value={`${completion}%`} label="Consistency"
        />
        <SummaryStatCard
          icon="flame" iconBg="#FF450022" iconColor="#FF4500"
          value={String(calories)} label="Calories"
        />
      </View>

      {/* Streak */}
      {stats.currentStreak > 0 && (
        <View style={ssStyles.streakRow}>
          <Ionicons name="flame" size={14} color={Colors.flame} />
          <Text style={ssStyles.streakText}>{stats.currentStreak}-day training streak</Text>
        </View>
      )}

      {/* Nudge */}
      {showNudge && (
        <View style={ssStyles.nudgeCard}>
          <Text style={ssStyles.nudgeTitle}>Ready for more?</Text>
          <Text style={ssStyles.nudgeBody}>
            3 sessions at {session.config.difficulty} with 90%+ — try stepping up to {nextDiff}.
          </Text>
        </View>
      )}

      {/* DONE button + Train Again link */}
      <TouchableOpacity style={ssStyles.doneBtn} onPress={() => { clearJustEarned(); onDone(); }} activeOpacity={0.85}>
        <Text style={ssStyles.doneBtnText}>DONE</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { clearJustEarned(); onAgain(); }} style={ssStyles.trainAgain} activeOpacity={0.75}>
        <Text style={ssStyles.trainAgainText}>Train Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const ssStyles = StyleSheet.create({
  container: {
    padding: Spacing.xl, paddingBottom: Spacing.xxxl,
    alignItems: 'center', gap: Spacing.md,
  },

  // Trophy
  trophyCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  trophyComplete: { backgroundColor: `${Colors.brand}22`, borderWidth: 2, borderColor: `${Colors.brand}66` },
  trophyEnded:    { backgroundColor: `${Colors.textMuted}22`, borderWidth: 2, borderColor: Colors.textMuted },

  // Headline
  headline: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subline:  { fontSize: FontSize.label, color: Colors.textSecondary, textAlign: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  savedText:{ fontSize: FontSize.label, color: Colors.primary },

  // PB
  pbBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: `${Colors.gold}14`, borderWidth: 1, borderColor: `${Colors.gold}44`,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  pbText: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.gold },

  // 2×3 stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 4,
  },
  statIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  statVal:  { fontSize: FontSize.title, fontWeight: FontWeight.bold },
  statLbl:  { fontSize: FontSize.caption, color: Colors.textMuted },

  // Streak
  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FF450014', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: '#FF450030',
  },
  streakText: { fontSize: FontSize.label, color: Colors.flame, fontWeight: FontWeight.semiBold },

  // Nudge
  nudgeCard: {
    width: '100%', backgroundColor: Colors.brandSoft, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.borderBrand, padding: Spacing.md, gap: 4,
  },
  nudgeTitle: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.brand },
  nudgeBody:  { fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },

  // Badge unlocks
  badgeUnlockWrap: {
    width: '100%',
    backgroundColor: `${Colors.gold}0D`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: `${Colors.gold}33`,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  badgeUnlockLabelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  badgeUnlockLabel: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.gold, letterSpacing: 1.2,
  },
  badgeUnlockRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  badgeUnlockIcon: {
    width: 38, height: 38, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeUnlockName: {
    fontSize: FontSize.label, fontWeight: FontWeight.bold,
  },
  badgeUnlockDesc: {
    fontSize: FontSize.caption, color: Colors.textMuted,
  },

  // Buttons
  doneBtn: {
    width: '100%', height: ButtonHeight.xl,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneBtnText: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 0.8 },
  trainAgain:  { paddingVertical: Spacing.md },
  trainAgainText: { fontSize: FontSize.body, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});

// ─── SessionModal (root) ──────────────────────────────────────────────────────

export default function SessionModal() {
  const { session, pendingConfig, clearPendingConfig } = useSessionStore();
  const settings = useSettingsStore((s) => s.settings);
  const gender   = useProfileStore((s) => s.profile.gender);
  const db = useSQLiteContext() as any;
  const engine = useSessionEngine(db);
  const savedBrightnessRef = useRef<number | null>(null);

  // Auto-start when a pendingConfig is set from HomeScreen / Routines
  useEffect(() => {
    if (pendingConfig) {
      engine.startSession(pendingConfig);
      clearPendingConfig();
    }
  }, [pendingConfig]);

  // Boost brightness when active/rest/countdown, restore when done/dismissed.
  // BUG-029: also restore on AppState background so brightness is not stuck at 1.0
  // if the user exits mid-session via the home button.
  useEffect(() => {
    const isRunning = session !== null &&
      session.state !== 'complete' &&
      session.state !== 'abandoned';

    if (!settings.keepScreenAwake) return;

    const restoreBrightness = () => {
      const saved = savedBrightnessRef.current;
      if (saved !== null) {
        Brightness.setBrightnessAsync(saved).catch(() => {});
        savedBrightnessRef.current = null;
      }
    };

    if (isRunning) {
      Brightness.getBrightnessAsync()
        .then((current) => {
          savedBrightnessRef.current = current;
          return Brightness.setBrightnessAsync(1.0);
        })
        .catch(() => {});
    } else {
      restoreBrightness();
    }

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') restoreBrightness();
    });
    return () => sub.remove();
  }, [session?.state, settings.keepScreenAwake]);

  const visible = session !== null;

  // Keep screen awake for entire session lifecycle (countdown → active → rest → summary).
  // Deactivates when session modal closes so normal screen-timeout resumes.
  // Respects the keepScreenAwake setting — if disabled, never activates.
  useEffect(() => {
    if (!settings.keepScreenAwake) return;
    if (visible) {
      activateKeepAwakeAsync('squash-session').catch(() => {});
    } else {
      try { deactivateKeepAwake('squash-session'); } catch {}
    }
    return () => { try { deactivateKeepAwake('squash-session'); } catch {} };
  }, [visible, settings.keepScreenAwake]);

  // Background behaviour: session continues running when screen is locked or app is backgrounded.
  // Player may use Bluetooth / speaker / headphones on court with phone in pocket.
  // Audio re-assertion is handled in useSessionEngine's AppState listener.

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Route to the correct view based on session state */}
        {session?.state === 'idle' && (
          <View style={idleStyles.container}>
            <Text style={idleStyles.instruction}>Move to the T</Text>
            <CourtCanvas
              activePosition={null}
              courtSystem={session.config.courtSystem}
              dominantHand={session.config.dominantHand}
              gender={gender}
              courtMode={settings.courtMode ?? 'wooden'}

              style={idleStyles.court}
            />
          </View>
        )}
        {session?.state === 'countdown' && (
          <CountdownView session={session} />
        )}
        {session?.state === 'active' && (
          <ActiveTrainingView
            session={session}
            onPause={engine.pauseSession}
            onEnd={engine.endSession}
            courtMode={settings.courtMode ?? 'wooden'}
            gender={gender}
          />
        )}
        {session?.state === 'paused' && (
          <PausedView
            session={session}
            onResume={engine.resumeSession}
            onEnd={engine.endSession}
            courtMode={settings.courtMode ?? 'wooden'}
            gender={gender}
          />
        )}
        {session?.state === 'rest' && (
          <RestView session={session} onSkip={engine.skipRest} courtMode={settings.courtMode ?? 'wooden'} gender={gender} />
        )}
        {(session?.state === 'complete' || session?.state === 'abandoned') && (
          <SessionSummaryView
            session={session}
            onDone={engine.dismissSession}
            onAgain={() => {
              const config = session.config;
              // BUG-031: clear PB flag so it doesn't bleed into the next session's summary.
              useProgressStore.getState().setNewPBFlag(null);
              engine.dismissSession();
              setTimeout(() => {
                useSessionStore.getState().setPendingConfig(config);
              }, 300);
            }}
          />
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
});

const idleStyles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  instruction: {
    fontSize: FontSize.title + 4, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, textAlign: 'center',
  },
  court: { width: '70%', aspectRatio: 640 / 975 },
});
