import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';
import { useProgressStore } from '../stores/progressStore';
import { useProgressLoader } from '../hooks/useProgressLoader';
import { useSessionStore } from '../stores/sessionStore';
import { useProfileStore } from '../stores/profileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { getProgramById } from '../data/builtinPrograms';
import { getIntervalMs, AUTO_REST_FACTORS, MOVES_PER_SET } from '../constants/timing';
import { useBadgesStore, BADGE_DEFS } from '../stores/badgesStore';

// Minimum sessions before the coach insight card activates (avoids premature advice).
const COACH_MIN_SESSIONS    = 5;
// Zone percentage below which the coach flags it as underworked.
const COACH_ZONE_THRESHOLD  = 25;

// ─── Weekly activity bar chart ────────────────────────────────────────────────

const DAYS = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
const BAR_W = 32;
const BAR_GAP = 10;
const CHART_W = DAYS.length * (BAR_W + BAR_GAP) - BAR_GAP;
const CHART_H = 80;

function WeeklyBars({
  weeklyActivity,
}: {
  weeklyActivity: Array<{ date: string; movements: number }>;
}) {
  const todayDow = new Date().getDay();
  const maxVal   = Math.max(...weeklyActivity.map((a) => a.movements), 1);

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={Colors.accentProgress} stopOpacity="1"   />
            <Stop offset="100%" stopColor={Colors.accentProgress} stopOpacity="0.25" />
          </SvgGradient>
          <SvgGradient id="gradToday" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={Colors.brand} stopOpacity="1"   />
            <Stop offset="100%" stopColor={Colors.brand} stopOpacity="0.35" />
          </SvgGradient>
        </Defs>
        {DAYS.map((_, i) => {
          const dow      = (i + 1) % 7;
          const activity = weeklyActivity.find((a) => new Date(a.date + 'T12:00:00').getDay() === dow);
          const val      = activity?.movements ?? 0;
          const barH     = val > 0 ? Math.max(10, Math.round((val / maxVal) * CHART_H)) : 5;
          const x        = i * (BAR_W + BAR_GAP);
          const y        = CHART_H - barH;
          const isToday  = todayDow === dow;
          return (
            <Rect
              key={i}
              x={x} y={y} width={BAR_W} height={barH}
              rx={7} ry={7}
              fill={
                val > 0
                  ? isToday ? 'url(#gradToday)' : 'url(#gradActive)'
                  : Colors.surfaceElevated
              }
            />
          );
        })}
      </Svg>
      <View style={chartStyles.dayRow}>
        {DAYS.map((d, i) => {
          const isToday = new Date().getDay() === (i + 1) % 7;
          return (
            <View key={i} style={chartStyles.dayCell}>
              {isToday && <View style={chartStyles.todayDot} />}
              <Text style={[chartStyles.dayLabel, isToday && chartStyles.dayLabelToday]}>
                {d}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  dayRow:       { flexDirection: 'row', marginTop: 8 },
  dayCell:      { width: BAR_W, marginRight: BAR_GAP, alignItems: 'center' },
  todayDot:     { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.brand, marginBottom: 3 },
  dayLabel:     { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium },
  dayLabelToday:{ color: Colors.brand, fontWeight: FontWeight.bold },
});

// ─── Court balance — tricolor bar ─────────────────────────────────────────────

function CourtBalance({
  distribution,
}: {
  distribution: { front: number; mid: number; back: number };
}) {
  const zones = [
    { label: 'Front', pct: Math.round(distribution.front), color: Colors.brand          },
    { label: 'Mid',   pct: Math.round(distribution.mid),   color: Colors.accentProgress },
    { label: 'Back',  pct: Math.round(distribution.back),  color: Colors.accentRoutines },
  ];
  return (
    <View>
      <View style={courtStyles.triBar}>
        {zones.map((z, idx) => (
          <View
            key={z.label}
            style={[
              courtStyles.triSeg,
              {
                flex:                    Math.max(2, z.pct),
                backgroundColor:         z.color,
                borderTopLeftRadius:     idx === 0 ? 8 : 0,
                borderBottomLeftRadius:  idx === 0 ? 8 : 0,
                borderTopRightRadius:    idx === 2 ? 8 : 0,
                borderBottomRightRadius: idx === 2 ? 8 : 0,
              },
            ]}
          />
        ))}
      </View>
      <View style={courtStyles.triLabels}>
        {zones.map((z) => (
          <View key={z.label} style={courtStyles.triItem}>
            <Text style={[courtStyles.triPct, { color: z.color }]}>{z.pct}%</Text>
            <Text style={courtStyles.triName}>{z.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const courtStyles = StyleSheet.create({
  triBar:    { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', gap: 2, marginBottom: Spacing.md },
  triSeg:    { height: '100%' },
  triLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  triItem:   { alignItems: 'center', flex: 1 },
  triPct:    { fontSize: FontSize.label, fontWeight: FontWeight.bold },
  triName:   { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
});

// ─── Drill constants ───────────────────────────────────────────────────────────

const COURT_SYSTEM_LABELS: Record<string, string> = {
  '6pt':  '6-Point',
  '10pt': '10-Point',
  '11pt': '11-Point English',
  'psa':  'PSA International',
};

const DRILL_COLOR = {
  'movement':   Colors.brand,
  'shot-based': Colors.accentRoutines,
  'match-sim':  Colors.accentLibrary,
  'custom':     Colors.accentProgress,
} as const;

const DRILL_ICON = {
  'movement':   'body-outline',
  'shot-based': 'golf-outline',
  'match-sim':  'trophy-outline',
  'custom':     'options-outline',
} as const;

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { stats, recentSessions, lastSessionCompletedAt } = useProgressStore();
  const { openDrillConfig, setPendingConfig } = useSessionStore();
  const { profile } = useProfileStore();
  const settings = useSettingsStore((s) => s.settings);
  const { loadData }  = useProgressLoader();
  const earnedBadges = useBadgesStore((s) => s.earned);
  const [selectedSession, setSelectedSession] = useState<typeof recentSessions[number] | null>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));
  useEffect(() => { if (lastSessionCompletedAt > 0) loadData(); }, [lastSessionCompletedAt]);

  // ── Fix: round to whole minutes before formatting
  const roundedMinutes = Math.round(stats.totalMinutes);
  const totalHours = roundedMinutes >= 60
    ? `${Math.floor(roundedMinutes / 60)}h ${roundedMinutes % 60}m`
    : `${roundedMinutes}m`;

  const coachWeakZone = stats.totalSessions >= COACH_MIN_SESSIONS
    ? (stats.zoneDistribution.back  < COACH_ZONE_THRESHOLD ? 'back'
      : stats.zoneDistribution.front < COACH_ZONE_THRESHOLD ? 'front' : null)
    : null;
  const coachDrillId = coachWeakZone === 'back'
    ? (['advanced', 'elite', 'pro'].includes(profile.skillLevel) ? 'ghost-master' : 'back-court-power')
    : coachWeakZone === 'front' ? 'front-court-focus' : null;
  const coachProgram = coachDrillId ? getProgramById(coachDrillId) : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const hasData = recentSessions.length > 0;
  const weekTotal = stats.weeklyActivity.reduce((s, a) => s + a.movements, 0);
  const streakPct = stats.longestStreak > 0
    ? Math.min(100, (stats.currentStreak / stats.longestStreak) * 100)
    : 0;

  const statTiles = [
    { val: String(stats.totalSessions),           lbl: 'Sessions',   icon: 'calendar',     color: Colors.brand          },
    { val: totalHours,                             lbl: 'On Court',   icon: 'time',         color: Colors.accentProgress },
    { val: stats.totalMovements.toLocaleString(),  lbl: 'Total Reps', icon: 'walk',         color: Colors.accentRoutines },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HERO HEADER ──────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="trending-up" size={11} color={Colors.accentProgress} />
              <Text style={styles.heroEyebrowText}>PROGRESS</Text>
            </View>
            {stats.lastSessionAt && (
              <Text style={styles.heroDate}>
                Last · {formatDate(stats.lastSessionAt)}
              </Text>
            )}
          </View>
          <Text style={styles.heroTitle}>Your Journey</Text>
          <View style={styles.heroAccent} />
        </View>

        {/* ── STAT TILES ──────────────────────────────────── */}
        <View style={styles.statRow}>
          {statTiles.map((t, i) => (
            <View key={i} style={[styles.statTile, { borderTopColor: t.color }]}>
              <View style={[styles.statIconWrap, { backgroundColor: `${t.color}1A` }]}>
                <Ionicons name={t.icon as any} size={14} color={t.color} />
              </View>
              <Text style={[styles.statVal, { color: t.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {t.val}
              </Text>
              <Text style={styles.statLbl}>{t.lbl}</Text>
            </View>
          ))}
        </View>

        {/* ── STREAK CARD ──────────────────────────────────── */}
        <View style={[styles.streakCard, stats.currentStreak > 0 && styles.streakCardActive]}>
          <View style={styles.streakInner}>
            <View style={styles.streakLeft}>
              <Text style={[styles.streakNum, { color: stats.currentStreak > 0 ? Colors.brand : Colors.textMuted }]}>
                {stats.currentStreak}
              </Text>
              <Text style={styles.streakUnit}>
                Day{stats.currentStreak !== 1 ? 's' : ''} Streak
              </Text>
              <Text style={styles.streakSub}>
                {stats.currentStreak === 0
                  ? 'Train today to ignite your streak'
                  : `Best: ${stats.longestStreak} day${stats.longestStreak !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <Ionicons
              name={stats.currentStreak > 0 ? 'flame' : 'flame-outline'}
              size={52}
              color={stats.currentStreak > 0 ? Colors.brand : Colors.textMuted}
              style={{ opacity: stats.currentStreak > 0 ? 1 : 0.25 }}
            />
          </View>
          {stats.longestStreak > 0 && (
            <View style={styles.streakBarRow}>
              <View style={styles.streakBarBg}>
                <View style={[styles.streakBarFill, { width: `${streakPct}%` as any }]} />
              </View>
              <Text style={styles.streakBarPct}>{Math.round(streakPct)}%</Text>
            </View>
          )}
        </View>

        {/* ── WEEKLY LOAD ──────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly Load</Text>
              <Text style={styles.cardSub}>Movement reps per day</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: `${Colors.accentProgress}18`, borderColor: `${Colors.accentProgress}30` }]}>
              <Ionicons name="walk" size={11} color={Colors.accentProgress} />
              <Text style={[styles.pillText, { color: Colors.accentProgress }]}>{weekTotal.toLocaleString()} reps</Text>
            </View>
          </View>
          <WeeklyBars weeklyActivity={stats.weeklyActivity} />
        </View>

        {/* ── ACHIEVEMENTS ─────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Achievements</Text>
              <Text style={styles.cardSub}>
                {Object.keys(earnedBadges).length === 0
                  ? 'Train to unlock these'
                  : `${Object.keys(earnedBadges).length} of ${BADGE_DEFS.length} unlocked`}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: `${Colors.gold}18`, borderColor: `${Colors.gold}30` }]}>
              <Ionicons name="medal" size={12} color={Colors.gold} />
              <Text style={[styles.pillText, { color: Colors.gold }]}>
                {Object.keys(earnedBadges).length}/{BADGE_DEFS.length}
              </Text>
            </View>
          </View>
          <View style={styles.achieveGrid}>
            {BADGE_DEFS.map((b) => {
              const unlocked = !!earnedBadges[b.id];
              return (
                <View key={b.id} style={styles.achieveItem}>
                  <View style={[
                    styles.achieveIcon,
                    {
                      backgroundColor: unlocked ? `${b.color}22` : `${b.color}10`,
                      borderColor:     unlocked ? `${b.color}55` : `${b.color}28`,
                      ...(unlocked && {
                        shadowColor: b.color, shadowOpacity: 0.4,
                        shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4,
                      }),
                    },
                  ]}>
                    <Ionicons
                      name={b.icon as any}
                      size={22}
                      color={unlocked ? b.color : `${b.color}70`}
                      style={{ opacity: unlocked ? 1 : 0.55 }}
                    />
                    {!unlocked && (
                      <View style={styles.achieveLockBadge}>
                        <Ionicons name="lock-closed" size={8} color={Colors.textMuted} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.achieveLabel, !unlocked && styles.achieveLockedLabel]} numberOfLines={1}>
                    {b.label}
                  </Text>
                  <Text style={styles.achieveHint} numberOfLines={2}>
                    {b.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── COURT BALANCE ────────────────────────────────── */}
        {hasData && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Court Balance</Text>
                <Text style={styles.cardSub}>
                  {coachWeakZone
                    ? `${coachWeakZone === 'back' ? 'Back' : 'Front'} court needs more work`
                    : 'Balanced court coverage'}
                </Text>
              </View>
              <View style={[
                styles.pill,
                coachWeakZone
                  ? { backgroundColor: `${Colors.warning}18`, borderColor: `${Colors.warning}30` }
                  : { backgroundColor: `${Colors.accentRoutines}18`, borderColor: `${Colors.accentRoutines}30` },
              ]}>
                <Ionicons
                  name={coachWeakZone ? 'warning' : 'checkmark-circle'}
                  size={12}
                  color={coachWeakZone ? Colors.warning : Colors.accentRoutines}
                />
                <Text style={[styles.pillText, { color: coachWeakZone ? Colors.warning : Colors.accentRoutines }]}>
                  {coachWeakZone ? 'Imbalanced' : 'Balanced'}
                </Text>
              </View>
            </View>
            <CourtBalance distribution={stats.zoneDistribution} />
          </View>
        )}

        {/* ── COACH INSIGHT ────────────────────────────────── */}
        {coachProgram && coachWeakZone && (
          <TouchableOpacity
            style={styles.insightCard}
            activeOpacity={0.82}
            onPress={() => setPendingConfig({
              ...coachProgram.config,
              dominantHand: profile.dominantHand,
              voiceGender:  profile.voiceGender,
              language:     profile.language,
              voiceMode:    settings.defaultVoiceMode,
            })}
          >
            <View style={styles.insightIconWrap}>
              <Ionicons name="bulb" size={22} color={Colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightEyebrow}>COACH INSIGHT</Text>
              <Text style={styles.insightMsg}>
                {coachWeakZone === 'back' ? 'Your back court is underworked' : 'Your front court needs attention'}
              </Text>
              <Text style={styles.insightLink}>{coachProgram.name} →</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* ── PERSONAL BESTS ───────────────────────────────── */}
        {stats.personalBests.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>PERSONAL BESTS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pbScroll}
            >
              {stats.personalBests.map((pb) => {
                const isReps = pb.metric === 'movements';
                const color  = isReps ? Colors.accentRoutines
                  : pb.metric === 'completion' ? Colors.accentProgress : Colors.brand;
                const icon   = isReps ? 'walk' : pb.metric === 'completion' ? 'checkmark-circle' : 'flash';
                return (
                  <View key={`${pb.drillType}-${pb.metric}`} style={[styles.pbCard, { borderTopColor: color, shadowColor: color }]}>
                    <View style={[styles.pbIconWrap, { backgroundColor: `${color}18` }]}>
                      <Ionicons name={icon as any} size={16} color={color} />
                    </View>
                    <Text style={[styles.pbVal, { color }]}>
                      {isReps
                        ? Math.round(pb.value)
                        : pb.metric === 'completion'
                        ? `${Math.round(pb.value)}%`
                        : Math.round(pb.value)}
                    </Text>
                    <Text style={styles.pbMetric}>
                      {isReps ? 'Most Reps' : pb.metric === 'completion' ? 'Completion' : 'Intensity'}
                    </Text>
                    <Text style={styles.pbDrill} numberOfLines={1}>
                      {pb.drillType.replace(/-/g, ' ')}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── RECENT SESSIONS ──────────────────────────────── */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
        </View>

        {!hasData ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bar-chart-outline" size={36} color={Colors.accentProgress} />
            </View>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>
              Complete your first ghosting session to start tracking your progress.
            </Text>
            <TouchableOpacity onPress={openDrillConfig} style={styles.emptyBtn}>
              <Ionicons name="play" size={14} color={Colors.background} />
              <Text style={styles.emptyBtnText}>Start a Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentSessions.slice(0, 10).map((s) => {
            const good       = s.completionPct >= 80;
            const barColor   = good ? Colors.accentRoutines : Colors.warning;
            const drillColor = DRILL_COLOR[s.drillType as keyof typeof DRILL_COLOR] ?? Colors.brand;
            const drillIcon  = DRILL_ICON[s.drillType as keyof typeof DRILL_ICON]  ?? 'body-outline';
            const clampedPct = Math.min(100, Math.max(0, s.completionPct));
            return (
              <TouchableOpacity key={s.id} style={[styles.sessionCard, { borderLeftColor: drillColor }]} onPress={() => setSelectedSession(s)} activeOpacity={0.78}>
                {/* Header row */}
                <View style={styles.sessionHead}>
                  <View style={[styles.sessionIconWrap, { backgroundColor: `${drillColor}18` }]}>
                    <Ionicons name={drillIcon as any} size={15} color={drillColor} />
                  </View>
                  <Text style={styles.sessionDrill} numberOfLines={1}>
                    {s.drillType.replace(/-/g, ' ')}
                  </Text>
                  <View style={[styles.sessionScoreBadge, { backgroundColor: `${drillColor}18`, borderColor: `${drillColor}35` }]}>
                    <Text style={[styles.sessionScoreNum, { color: drillColor }]}>
                      {Math.round(s.intensityScore)}
                    </Text>
                    <Text style={styles.sessionScoreLbl}>pts</Text>
                  </View>
                </View>

                {/* Meta row */}
                <View style={styles.sessionMeta}>
                  <View style={styles.sessionChip}>
                    <Ionicons name="calendar-outline" size={10} color={Colors.textMuted} />
                    <Text style={styles.sessionChipText}>{formatDate(s.startedAt)}</Text>
                  </View>
                  <View style={styles.sessionChip}>
                    <Ionicons name="time-outline" size={10} color={Colors.textMuted} />
                    <Text style={styles.sessionChipText}>{formatDuration(s.durationSeconds)}</Text>
                  </View>
                  <View style={styles.sessionChip}>
                    <Ionicons name="walk-outline" size={10} color={Colors.textMuted} />
                    <Text style={styles.sessionChipText}>{s.movementsTotal} reps</Text>
                  </View>
                  <View style={[styles.sessionChip, { borderColor: `${drillColor}40`, backgroundColor: `${drillColor}10` }]}>
                    <Text style={[styles.sessionChipText, { color: drillColor, fontWeight: FontWeight.bold }]}>
                      {s.courtSystem.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Completion bar */}
                <View style={styles.sessionBarRow}>
                  <View style={styles.sessionBarBg}>
                    <View style={[styles.sessionBarFill, { width: `${clampedPct}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.sessionBarPct, { color: barColor }]}>{Math.round(clampedPct)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

      {/* Session Detail Modal (PQA-08) */}
      {selectedSession && (() => {
        const s = selectedSession;
        const drillColor = DRILL_COLOR[s.drillType as keyof typeof DRILL_COLOR] ?? Colors.brand;
        const good = s.completionPct >= 80;
        const barColor = good ? Colors.accentRoutines : Colors.warning;
        const clampedPct = Math.min(100, Math.max(0, s.completionPct));
        const mm = String(Math.floor(s.durationSeconds / 60)).padStart(2, '0');
        const ss2 = String(s.durationSeconds % 60).padStart(2, '0');
        // Estimate net active time by subtracting auto-rest (restMode not stored; approximation).
        const movesPerSet     = MOVES_PER_SET[s.difficulty] ?? 12;
        const intervalMs      = getIntervalMs(s.difficulty, s.tempo);
        const restPerSetSecs  = Math.round(movesPerSet * intervalMs * (AUTO_REST_FACTORS[s.difficulty] ?? 0.28) / 1000);
        const setsCompleted   = s.movementsTotal > 0 ? Math.ceil(s.movementsTotal / movesPerSet) : 0;
        const netActiveSecs   = Math.max(1, s.durationSeconds - setsCompleted * restPerSetSecs);
        const avgRep = s.movementsTotal > 0
          ? (netActiveSecs / s.movementsTotal).toFixed(1)
          : '—';
        return (
          <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedSession(null)}>
            <View style={sdStyles.backdrop}>
              <SafeAreaView edges={['bottom']} style={sdStyles.safeSheet}>
              <View style={sdStyles.sheet}>
                {/* Handle */}
                <View style={sdStyles.handle} />

                {/* Header */}
                <View style={sdStyles.header}>
                  <View style={[sdStyles.drillDot, { backgroundColor: drillColor }]} />
                  <Text style={sdStyles.drillName}>{s.drillType.replace(/-/g, ' ')}</Text>
                  <TouchableOpacity onPress={() => setSelectedSession(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={22} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={sdStyles.date}>{formatDate(s.startedAt)}</Text>

                {/* Stats grid */}
                <View style={sdStyles.grid}>
                  {[
                    { label: 'Duration',    value: `${mm}:${ss2}` },
                    { label: 'Reps',        value: `${s.movementsTotal}` },
                    { label: 'Rep Speed',   value: `${avgRep}s` },
                    { label: 'Score',       value: `${Math.round(s.intensityScore)}` },
                    { label: 'Difficulty',  value: s.difficulty ?? '—' },
                    { label: 'Court',       value: COURT_SYSTEM_LABELS[s.courtSystem] ?? s.courtSystem.toUpperCase() },
                  ].map(({ label, value }) => (
                    <View key={label} style={sdStyles.gridCell}>
                      <Text style={sdStyles.cellValue}>{value}</Text>
                      <Text style={sdStyles.cellLabel}>{label}</Text>
                    </View>
                  ))}
                </View>

                {/* Completion */}
                <Text style={sdStyles.sectionLabel}>COMPLETION</Text>
                <View style={sdStyles.barRow}>
                  <View style={sdStyles.barBg}>
                    <View style={[sdStyles.barFill, { width: `${clampedPct}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[sdStyles.barPct, { color: barColor }]}>{Math.round(clampedPct)}%</Text>
                </View>

                <TouchableOpacity style={sdStyles.closeBtn} onPress={() => setSelectedSession(null)} activeOpacity={0.85}>
                  <Text style={sdStyles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
              </SafeAreaView>
            </View>
          </Modal>
        );
      })()}
    </SafeAreaView>
  );
}

// ─── Session Detail Styles ─────────────────────────────────────────────────────

const sdStyles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  safeSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1, borderTopColor: Colors.border,
    overflow: 'hidden',
  },
  sheet: {
    backgroundColor: Colors.surface,
    padding: Spacing.base, paddingBottom: Spacing.xl,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4,
    backgroundColor: Colors.border, borderRadius: 2, marginBottom: Spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  drillDot: { width: 10, height: 10, borderRadius: 5 },
  drillName: { flex: 1, fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, textTransform: 'capitalize' },
  date: { fontSize: FontSize.caption, color: Colors.textMuted, marginBottom: Spacing.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  gridCell: {
    flex: 1, minWidth: '28%',
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  cellValue: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cellLabel: { fontSize: FontSize.micro, color: Colors.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.textDisabled, letterSpacing: 1.2, marginBottom: Spacing.xs },
  barRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  barBg:   { flex: 1, height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barPct:  { fontSize: FontSize.label, fontWeight: FontWeight.bold, width: 36, textAlign: 'right' },
  closeBtn: {
    height: 48, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: FontSize.body, color: Colors.textMuted, fontWeight: FontWeight.medium },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },

  // ── Hero
  hero: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.xs,
  },
  heroEyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${Colors.accentProgress}18`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.accentProgress}30`,
  },
  heroEyebrowText: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.accentProgress, letterSpacing: 1.2,
  },
  heroDate: { fontSize: FontSize.caption, color: Colors.textMuted },
  heroTitle: {
    fontSize: 34, fontWeight: FontWeight.black,
    color: Colors.textPrimary, letterSpacing: -0.8,
    marginBottom: Spacing.sm,
  },
  heroAccent: {
    width: 48, height: 3,
    backgroundColor: Colors.brand,
    borderRadius: 2,
  },

  // ── Stat tiles
  statRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.md,
    alignItems: 'center', gap: 4,
  },
  statIconWrap: {
    width: 28, height: 28, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statVal: {
    fontSize: FontSize.sectionHeader, fontWeight: FontWeight.black,
    letterSpacing: -0.5,
  },
  statLbl: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium, textAlign: 'center' },

  // ── Streak card
  streakCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base,
  },
  streakCardActive: {
    borderColor: `${Colors.brand}40`,
    backgroundColor: `${Colors.brand}06`,
  },
  streakInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  streakLeft:  { gap: 2 },
  streakNum: {
    fontSize: 48, fontWeight: FontWeight.black,
    lineHeight: 52, letterSpacing: -2,
  },
  streakUnit: {
    fontSize: FontSize.label, fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  streakSub: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  streakBarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streakBarBg: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: Colors.surfaceElevated, overflow: 'hidden',
  },
  streakBarFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: Colors.brand,
  },
  streakBarPct: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.brand, minWidth: 30, textAlign: 'right',
  },

  // ── Shared card
  card: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  cardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub:   { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 3 },

  // ── Pill badge
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  pillText: { fontSize: FontSize.caption, fontWeight: FontWeight.bold },

  // ── Achievements
  achieveGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  achieveItem: { alignItems: 'center', flex: 1, gap: 4 },
  achieveIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  achieveLockBadge: {
    position: 'absolute', bottom: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  achieveLabel: {
    fontSize: 10, fontWeight: FontWeight.bold,
    color: Colors.textSecondary, textAlign: 'center',
  },
  achieveLockedLabel: { color: Colors.textMuted, fontWeight: FontWeight.medium },
  achieveHint: {
    fontSize: FontSize.micro, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 14,
    paddingHorizontal: 2,
  },

  // ── Coach insight
  insightCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: `${Colors.brand}35`,
    padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  insightIconWrap: {
    width: 46, height: 46, borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  insightEyebrow: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1, marginBottom: 3,
  },
  insightMsg:  { fontSize: FontSize.label, color: Colors.textPrimary, marginBottom: 3 },
  insightLink: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.brand },

  // ── Section header
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm, marginTop: Spacing.xs,
  },
  sectionAccent: {
    width: 3, height: 14, borderRadius: 2,
    backgroundColor: Colors.brand,
  },
  sectionLabel: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1.3,
  },

  // ── Personal bests
  pbScroll: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.sm },
  pbCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.md,
    width: 115, gap: 3,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pbIconWrap: {
    width: 30, height: 30, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  pbVal:    { fontSize: 22, fontWeight: FontWeight.black },
  pbMetric: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  pbDrill:  { fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize' },

  // ── Session cards
  sessionCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sessionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sessionIconWrap: {
    width: 30, height: 30, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sessionDrill: {
    flex: 1, fontSize: FontSize.label, fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary, textTransform: 'capitalize',
  },
  sessionScoreBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    borderRadius: BorderRadius.md, borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  sessionScoreNum: { fontSize: FontSize.label, fontWeight: FontWeight.black },
  sessionScoreLbl: { fontSize: FontSize.micro, color: Colors.textMuted },
  sessionMeta: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  sessionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  sessionChipText: { fontSize: 10, color: Colors.textMuted },
  sessionBarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  sessionBarBg: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: Colors.surfaceElevated, overflow: 'hidden',
  },
  sessionBarFill: { height: '100%', borderRadius: 3 },
  sessionBarPct: { fontSize: FontSize.micro, fontWeight: FontWeight.bold, minWidth: 30, textAlign: 'right' },

  // ── Empty state
  emptyCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center', gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${Colors.accentProgress}15`,
    borderWidth: 1, borderColor: `${Colors.accentProgress}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyBody: {
    fontSize: FontSize.label, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accentProgress,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    fontSize: FontSize.label, color: Colors.background, fontWeight: FontWeight.bold,
  },
});
