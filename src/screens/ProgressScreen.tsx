import React, { useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';
import { useProgressStore } from '../stores/progressStore';
import { useProgressLoader } from '../hooks/useProgressLoader';
import { useSessionStore } from '../stores/sessionStore';
import { useProfileStore } from '../stores/profileStore';
import { getProgramById } from '../data/builtinPrograms';
import { useBadgesStore, BADGE_DEFS } from '../stores/badgesStore';

// ─── Weekly activity bar chart ────────────────────────────────────────────────

const DAYS = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
const BAR_W = 28; const BAR_GAP = 12;
const CHART_W = DAYS.length * (BAR_W + BAR_GAP) - BAR_GAP;
const CHART_H = 72;

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
        {DAYS.map((_, i) => {
          const dow      = (i + 1) % 7;
          const activity = weeklyActivity.find((a) => new Date(a.date).getDay() === dow);
          const val      = activity?.movements ?? 0;
          const barH     = val > 0 ? Math.max(8, Math.round((val / maxVal) * CHART_H)) : 4;
          const x        = i * (BAR_W + BAR_GAP);
          const y        = CHART_H - barH;
          const isToday  = todayDow === dow;
          return (
            <Rect
              key={i}
              x={x} y={y} width={BAR_W} height={barH}
              rx={6} ry={6}
              fill={
                val > 0
                  ? isToday ? Colors.accentProgress : `${Colors.accentProgress}55`
                  : Colors.surfaceElevated
              }
            />
          );
        })}
      </Svg>
      <View style={styles.dayRow}>
        {DAYS.map((d, i) => {
          const isToday = new Date().getDay() === (i + 1) % 7;
          return (
            <Text key={i} style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
              {d}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

// ─── Court balance — single tricolor bar ─────────────────────────────────────

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
      {/* Tricolor segmented bar */}
      <View style={styles.triBar}>
        {zones.map((z, idx) => (
          <View
            key={z.label}
            style={[
              styles.triSegment,
              {
                flex:            Math.max(2, z.pct),
                backgroundColor: z.color,
                borderTopLeftRadius:     idx === 0 ? 6 : 0,
                borderBottomLeftRadius:  idx === 0 ? 6 : 0,
                borderTopRightRadius:    idx === 2 ? 6 : 0,
                borderBottomRightRadius: idx === 2 ? 6 : 0,
              },
            ]}
          />
        ))}
      </View>
      {/* Labels */}
      <View style={styles.triLabels}>
        {zones.map((z) => (
          <View key={z.label} style={styles.triLabelItem}>
            <Text style={[styles.triPct, { color: z.color }]}>{z.pct}%</Text>
            <Text style={styles.triZoneName}>{z.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const DRILL_COLOR = {
  'movement':  Colors.brand,
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
  const { loadData }  = useProgressLoader();
  const earnedBadges = useBadgesStore((s) => s.earned);

  // Load on tab focus
  useFocusEffect(useCallback(() => { loadData(); }, []));
  // Also reload whenever a session completes (even if Progress tab is already active)
  useEffect(() => { if (lastSessionCompletedAt > 0) loadData(); }, [lastSessionCompletedAt]);

  // Formatted totals
  const totalHours = stats.totalMinutes >= 60
    ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
    : `${stats.totalMinutes}m`;

  // Coach insight
  const coachWeakZone = stats.totalSessions >= 5
    ? (stats.zoneDistribution.back  < 25 ? 'back'
      : stats.zoneDistribution.front < 25 ? 'front' : null)
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PROGRESS</Text>
            <Text style={styles.title}>Your Journey</Text>
          </View>
          {stats.lastSessionAt && (
            <Text style={styles.lastSeen}>
              Last session {formatDate(stats.lastSessionAt)}
            </Text>
          )}
        </View>

        {/* ── 3-stat strip ─────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.stripStat}>
            <Text style={styles.stripVal}>{stats.totalSessions}</Text>
            <Text style={styles.stripLbl}>Sessions</Text>
          </View>
          <View style={styles.stripDiv} />
          <View style={styles.stripStat}>
            <Text style={styles.stripVal}>{totalHours}</Text>
            <Text style={styles.stripLbl}>On Court</Text>
          </View>
          <View style={styles.stripDiv} />
          <View style={styles.stripStat}>
            <Text style={[styles.stripVal, { color: Colors.accentProgress }]}>
              {stats.totalMovements.toLocaleString()}
            </Text>
            <Text style={styles.stripLbl}>Total Reps</Text>
          </View>
        </View>

        {/* ── Streak card ──────────────────────────────────────── */}
        <View style={[
          styles.streakCard,
          stats.currentStreak > 0 && styles.streakCardActive,
        ]}>
          <View style={styles.streakRow}>
            <View>
              <Text style={[
                styles.streakNum,
                { color: stats.currentStreak > 0 ? Colors.brand : Colors.textMuted },
              ]}>
                {stats.currentStreak}
              </Text>
              <Text style={styles.streakDayLabel}>
                Day{stats.currentStreak !== 1 ? 's' : ''} Streak
              </Text>
              {stats.currentStreak === 0 ? (
                <Text style={styles.streakCta}>Train today to start your streak</Text>
              ) : (
                <Text style={styles.streakBest}>
                  Personal best: {stats.longestStreak} days
                </Text>
              )}
            </View>
            <Ionicons
              name={stats.currentStreak > 0 ? 'flame' : 'flame-outline'}
              size={40}
              color={stats.currentStreak > 0 ? Colors.brand : Colors.textMuted}
              style={{ opacity: stats.currentStreak > 0 ? 1 : 0.4 }}
            />
          </View>
        </View>

        {/* ── Weekly Load ──────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly Load</Text>
              <Text style={styles.cardSub}>Reps per day this week</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {stats.weeklyActivity.reduce((s, a) => s + a.movements, 0)} reps
              </Text>
            </View>
          </View>
          <WeeklyBars weeklyActivity={stats.weeklyActivity} />
        </View>

        {/* ── Achievements ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Achievements</Text>
              <Text style={styles.cardSub}>
                {Object.keys(earnedBadges).length} of {BADGE_DEFS.length} unlocked
              </Text>
            </View>
            <Ionicons name="medal-outline" size={20} color={Colors.gold} />
          </View>
          <View style={styles.achievementRow}>
            {BADGE_DEFS.map((b) => {
              const unlocked = !!earnedBadges[b.id];
              return (
                <View key={b.id} style={styles.achievementItem}>
                  <View style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: unlocked ? `${b.color}22` : Colors.surfaceElevated,
                      borderColor:     unlocked ? `${b.color}55` : Colors.border,
                    },
                  ]}>
                    <Ionicons
                      name={b.icon as any}
                      size={22}
                      color={unlocked ? b.color : Colors.textDisabled}
                    />
                  </View>
                  <Text
                    style={[styles.achievementLabel, !unlocked && styles.achievementLocked]}
                    numberOfLines={2}
                  >
                    {b.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Court Balance ────────────────────────────────────── */}
        {hasData && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Court Balance</Text>
                <Text style={styles.cardSub}>
                  {coachWeakZone
                    ? `${coachWeakZone === 'back' ? 'Back' : 'Front'} court needs work`
                    : 'Well balanced court coverage'}
                </Text>
              </View>
              <Ionicons
                name={coachWeakZone ? 'warning-outline' : 'checkmark-circle-outline'}
                size={20}
                color={coachWeakZone ? Colors.warning : Colors.accentRoutines}
              />
            </View>
            <CourtBalance distribution={stats.zoneDistribution} />
          </View>
        )}

        {/* ── Coach Insight ────────────────────────────────────── */}
        {coachProgram && coachWeakZone && (
          <TouchableOpacity
            style={styles.insightCard}
            activeOpacity={0.82}
            onPress={() => setPendingConfig({
              ...coachProgram.config,
              dominantHand: profile.dominantHand,
              voiceGender:  profile.voiceGender,
              language:     profile.language,
            })}
          >
            <View style={styles.insightIcon}>
              <Ionicons name="bulb" size={22} color={Colors.brand} />
            </View>
            <View style={styles.insightText}>
              <Text style={styles.insightLabel}>COACH INSIGHT</Text>
              <Text style={styles.insightMsg}>
                {coachWeakZone === 'back'
                  ? 'Your back court is underworked'
                  : 'Your front court needs attention'}
              </Text>
              <Text style={styles.insightLink}>{coachProgram.name} →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Personal Bests ───────────────────────────────────── */}
        {stats.personalBests.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PERSONAL BESTS</Text>
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
                  <View key={`${pb.drillType}-${pb.metric}`} style={[styles.pbCard, { borderTopColor: color }]}>
                    <Ionicons name={icon as any} size={18} color={color} style={{ marginBottom: 6 }} />
                    <Text style={[styles.pbVal, { color }]}>
                      {isReps ? Math.round(pb.value) : `${Math.round(pb.value)}%`}
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

        {/* ── Recent Sessions ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>

        {!hasData ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>
              Complete your first ghosting session to see your progress here.
            </Text>
            <TouchableOpacity onPress={openDrillConfig} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Start a Session →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentSessions.slice(0, 5).map((s) => {
            const good       = s.completionPct >= 80;
            const barColor   = good ? Colors.accentRoutines : Colors.warning;
            const drillColor = DRILL_COLOR[s.drillType as keyof typeof DRILL_COLOR] ?? Colors.brand;
            const drillIcon  = DRILL_ICON[s.drillType as keyof typeof DRILL_ICON]  ?? 'body-outline';
            const clampedPct = Math.min(100, Math.max(0, s.completionPct));
            return (
              <View
                key={s.id}
                style={[styles.sessionCard, { borderLeftColor: drillColor }]}
              >
                {/* Top: icon + drill name + score */}
                <View style={styles.sessionTop}>
                  <View style={[styles.sessionIconWrap, { backgroundColor: `${drillColor}18` }]}>
                    <Ionicons name={drillIcon as any} size={15} color={drillColor} />
                  </View>
                  <Text style={styles.sessionDrill} numberOfLines={1}>
                    {s.drillType.replace(/-/g, ' ')}
                  </Text>
                  <View style={styles.sessionScoreWrap}>
                    <Text style={[styles.sessionScore, { color: drillColor }]}>
                      {Math.round(s.intensityScore)}
                    </Text>
                    <Text style={styles.sessionScoreLbl}>score</Text>
                  </View>
                </View>

                {/* Middle: meta chips */}
                <View style={styles.sessionMetaRow}>
                  <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.sessionMetaTxt}>{formatDate(s.startedAt)}</Text>
                  <Text style={styles.sessionMetaDot}>·</Text>
                  <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.sessionMetaTxt}>{formatDuration(s.durationSeconds)}</Text>
                  <Text style={styles.sessionMetaDot}>·</Text>
                  <Ionicons name="walk-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.sessionMetaTxt}>{s.movementsTotal} reps</Text>
                  <Text style={styles.sessionMetaDot}>·</Text>
                  <Text style={[styles.sessionCourtBadge, { color: drillColor }]}>
                    {s.courtSystem.toUpperCase()}
                  </Text>
                </View>

                {/* Bottom: completion bar */}
                <View style={styles.sessionBarRow}>
                  <View style={styles.sessionBarBg}>
                    <View
                      style={[
                        styles.sessionBarFill,
                        { width: `${clampedPct}%` as any, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                  <Text style={[styles.sessionBarPct, { color: barColor }]}>
                    {Math.round(clampedPct)}%
                  </Text>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },

  // ── Header
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md, paddingBottom: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.accentProgress, letterSpacing: 1.5, marginBottom: 4,
  },
  title: {
    fontSize: 30, fontWeight: FontWeight.black,
    color: Colors.textPrimary, letterSpacing: -0.5,
  },
  lastSeen: {
    fontSize: FontSize.caption, color: Colors.textMuted,
    alignSelf: 'flex-end',
  },

  // ── Stats strip
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  stripStat:  { flex: 1, alignItems: 'center' },
  stripDiv:   { width: 1, height: 36, backgroundColor: Colors.border },
  stripVal:   { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stripLbl:   { fontSize: FontSize.micro, color: Colors.textMuted, marginTop: 3 },

  // ── Streak card
  streakCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  streakCardActive: {
    borderColor: `${Colors.brand}40`,
    backgroundColor: `${Colors.brand}08`,
  },
  streakRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  streakNum: {
    fontSize: 40, fontWeight: FontWeight.black,
    lineHeight: 44, letterSpacing: -1,
  },
  streakDayLabel: {
    fontSize: FontSize.label, fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary, marginTop: 2,
  },
  streakBest: {
    fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4,
  },
  streakCta: {
    fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4,
  },

  // ── Shared card
  card: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
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
  badge: {
    backgroundColor: `${Colors.accentProgress}18`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  badgeText: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.accentProgress },

  // ── Achievements
  achievementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementItem: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
  },
  achievementIcon: {
    width: 48, height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  achievementLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  achievementLocked: {
    color: Colors.textDisabled,
  },

  // ── Section label
  sectionLabel: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1.2,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },

  // ── Weekly chart
  dayRow: {
    flexDirection: 'row', marginTop: 8,
    width: CHART_W,
  },
  dayLabel: {
    width: BAR_W, textAlign: 'center',
    fontSize: 10, color: Colors.textMuted,
    marginRight: BAR_GAP,
  },
  dayLabelToday: { color: Colors.accentProgress, fontWeight: FontWeight.bold },

  // ── Court balance
  triBar: {
    flexDirection: 'row', height: 14,
    borderRadius: 7, overflow: 'hidden',
    gap: 2, marginBottom: Spacing.md,
  },
  triSegment: { height: '100%' },
  triLabels:  { flexDirection: 'row', justifyContent: 'space-between' },
  triLabelItem:  { alignItems: 'center', flex: 1 },
  triPct:     { fontSize: FontSize.label, fontWeight: FontWeight.bold },
  triZoneName:{ fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },

  // ── Coach insight
  insightCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderBrand,
    padding: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  insightIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  insightText:  { flex: 1 },
  insightLabel: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1, marginBottom: 3,
  },
  insightMsg:  { fontSize: FontSize.label, color: Colors.textPrimary, marginBottom: 3 },
  insightLink: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.brand },

  // ── Personal bests
  pbScroll: {
    paddingHorizontal: Spacing.base, gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pbCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.md,
    width: 110, alignItems: 'flex-start',
  },
  pbVal:    { fontSize: 22, fontWeight: FontWeight.black, marginBottom: 2 },
  pbMetric: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  pbDrill:  { fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize', marginTop: 2 },

  // ── Session cards
  sessionCard: {
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sessionTop: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  sessionIconWrap: {
    width: 28, height: 28, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sessionDrill: {
    flex: 1,
    fontSize: FontSize.label, fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary, textTransform: 'capitalize',
  },
  sessionScoreWrap: { alignItems: 'center', minWidth: 36 },
  sessionScore: {
    fontSize: FontSize.title, fontWeight: FontWeight.black, lineHeight: 24,
  },
  sessionScoreLbl: { fontSize: FontSize.micro, color: Colors.textMuted },
  sessionMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap',
  },
  sessionMetaTxt: { fontSize: FontSize.caption, color: Colors.textMuted },
  sessionMetaDot: { fontSize: FontSize.caption, color: Colors.textDisabled },
  sessionCourtBadge: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold, letterSpacing: 0.5,
  },
  sessionBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2,
  },
  sessionBarBg: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: Colors.surfaceElevated, overflow: 'hidden',
  },
  sessionBarFill: { height: '100%', borderRadius: 3 },
  sessionBarPct: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold, minWidth: 30, textAlign: 'right',
  },

  // ── Empty state
  emptyCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center', gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary,
  },
  emptyBody: {
    fontSize: FontSize.label, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.accentProgress,
  },
  emptyBtnText: {
    fontSize: FontSize.label, color: Colors.accentProgress, fontWeight: FontWeight.semiBold,
  },
});
