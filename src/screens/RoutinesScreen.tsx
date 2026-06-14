import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../constants/layout';
import { BUILTIN_PROGRAMS, getSuggestedDrill } from '../data/builtinPrograms';
import { useSessionStore } from '../stores/sessionStore';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';
import { Program, SkillLevel } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const COACHING_TIPS = [
  'Always recover to the T after each shot — equal reach to all four corners.',
  "Watch your opponent's racket, not the ball — you'll read the shot earlier.",
  'Stay on your toes between shots — shaves milliseconds off your reaction time.',
  'Ghosting builds muscle memory that transfers directly to match play.',
  'Keep the ball tight to the side walls — restricts your opponent\'s angles.',
  'Consistent short sessions beat rare long ones — aim for 4+ per week.',
  'Breathe out on every swing — relaxes your grip and improves racket control.',
  'Work the back corners relentlessly — most players are weakest there.',
  'The drop shot lands best when your opponent is deep in the back court.',
  'Use cross-court patterns sparingly — straight drives keep you near the T.',
];

const LEVEL_META: Record<string, { color: string; icon: string; label: string; desc: string }> = {
  beginner:     { color: Colors.levelBeginner,     icon: 'leaf-outline',      label: 'Beginner',     desc: 'Foundation & court movement'       },
  intermediate: { color: Colors.levelIntermediate, icon: 'flash-outline',     label: 'Intermediate', desc: 'Speed, coverage & tactics'         },
  advanced:     { color: Colors.levelAdvanced,     icon: 'flame-outline',     label: 'Advanced',     desc: 'High-intensity competitive drills' },
  elite:        { color: Colors.levelElite,        icon: 'star-outline',      label: 'Elite',        desc: 'Match-level intensity & pressure'  },
  pro:          { color: Colors.levelPro,          icon: 'diamond-outline',   label: 'Pro',          desc: 'Professional-grade programs'       },
  custom:       { color: Colors.accentRoutines,    icon: 'construct-outline', label: 'Custom',       desc: 'Build your own session from scratch'},
};

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'elite', 'pro'];
type GridKey = SkillLevel | 'custom';
const GRID_KEYS: GridKey[] = [...LEVELS, 'custom'];
const GRID_ROWS: GridKey[][] = [
  [GRID_KEYS[0], GRID_KEYS[1]],
  [GRID_KEYS[2], GRID_KEYS[3]],
  [GRID_KEYS[4], GRID_KEYS[5]],
];

const DRILL_ICON: Record<string, string> = {
  movement: 'walk-outline', 'shot-based': 'golf-outline',
  'match-sim': 'trophy-outline', custom: 'construct-outline',
};
const TEMPO_LABEL: Record<string, string> = { slow: 'Slow', natural: 'Natural', explosive: 'Explosive' };
const DRILL_LABEL: Record<string, string>  = {
  movement: 'Movement', 'shot-based': 'Shots', 'match-sim': 'Match Sim', custom: 'Custom',
};

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ gridKey, onPress }: { gridKey: GridKey; onPress: () => void }) {
  const meta     = LEVEL_META[gridKey];
  const isCustom = gridKey === 'custom';
  const count    = isCustom ? null : BUILTIN_PROGRAMS.filter((p) => p.level === gridKey).length;

  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: meta.color }]}
      onPress={onPress}
      activeOpacity={0.76}
    >
      <View style={styles.cardIconRow}>
        <View style={{ flex: 1 }} />
        <Ionicons name={meta.icon as any} size={16} color={`${meta.color}65`} />
      </View>
      <Text style={styles.cardName} numberOfLines={1}>{meta.label}</Text>
      <Text style={styles.cardDesc} numberOfLines={1}>{meta.desc}</Text>
      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: `${meta.color}1A` }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {isCustom ? 'Build now' : count! > 0 ? `${count} programs` : 'Coming soon'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Program card (detail view) ───────────────────────────────────────────────

function ProgramCard({
  program, onStart, levelColor,
}: { program: Program; onStart: (p: Program) => void; levelColor: string }) {
  const icon     = DRILL_ICON[program.config.drillType] ?? 'body-outline';
  const tempo    = TEMPO_LABEL[program.config.tempo] ?? '';
  const drillLbl = DRILL_LABEL[program.config.drillType] ?? program.config.drillType;

  return (
    <View style={styles.programCard}>
      <View style={[styles.programAccent, { backgroundColor: levelColor }]} />
      <View style={[styles.programIcon, { backgroundColor: `${levelColor}18` }]}>
        <Ionicons name={icon as any} size={20} color={levelColor} />
      </View>
      <View style={styles.programBody}>
        <View style={styles.programTopRow}>
          <Text style={styles.programName} numberOfLines={1}>{program.name}</Text>
          <View style={styles.durationChip}>
            <Ionicons name="time-outline" size={10} color={Colors.textMuted} />
            <Text style={styles.durationText}>{program.estimatedMinutes} min</Text>
          </View>
        </View>
        <Text style={styles.programDesc} numberOfLines={2}>{program.description}</Text>
        <View style={styles.programMeta}>
          <Text style={styles.metaTag}>{program.config.courtSystem.toUpperCase()}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTag}>{tempo}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaTag}>{drillLbl}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.playBtn, { backgroundColor: levelColor }]}
        onPress={() => onStart(program)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="play" size={12} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const [detailLevel, setDetailLevel] = useState<SkillLevel | null>(null);
  const { setPendingConfig, openDrillConfig } = useSessionStore();
  const { profile } = useProfileStore();
  const { stats, recentSessions } = useProgressStore();

  const suggested = getSuggestedDrill(
    stats.zoneDistribution,
    stats.totalSessions,
    recentSessions[0]?.drillType ?? null,
    profile.skillLevel,
  );
  const suggestedMeta = LEVEL_META[suggested.program.level] ?? LEVEL_META.beginner;
  const suggestedIcon = DRILL_ICON[suggested.program.config.drillType] ?? 'body-outline';
  const todayTip = COACHING_TIPS[Math.floor(Date.now() / 86_400_000) % COACHING_TIPS.length];

  function handleStart(program: Program) {
    setPendingConfig({
      ...program.config,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
    });
  }

  function handleGridTap(key: GridKey) {
    if (key === 'custom') openDrillConfig();
    else setDetailLevel(key as SkillLevel);
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (detailLevel !== null) {
    const meta     = LEVEL_META[detailLevel];
    const programs = BUILTIN_PROGRAMS.filter((p) => p.level === detailLevel);
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setDetailLevel(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.detailHeaderCenter}>
            <View style={[styles.detailDot, { backgroundColor: meta.color }]} />
            <Text style={styles.detailTitle}>{meta.label}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailBanner, { borderColor: `${meta.color}30`, backgroundColor: `${meta.color}0D` }]}>
            <View style={[styles.detailBannerIcon, { backgroundColor: meta.color }]}>
              <Ionicons name={meta.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.detailBannerText}>
              <Text style={[styles.detailBannerLevel, { color: meta.color }]}>{meta.label}</Text>
              <Text style={styles.detailBannerDesc}>{meta.desc}</Text>
            </View>
            <Text style={[styles.detailBannerCount, { color: meta.color }]}>{programs.length}</Text>
          </View>
          {programs.length > 0 ? (
            programs.map((p) => (
              <ProgramCard key={p.id} program={p} onStart={handleStart} levelColor={meta.color} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: `${meta.color}18` }]}>
                <Ionicons name="hourglass-outline" size={28} color={meta.color} />
              </View>
              <Text style={styles.emptyTitle}>Coming Soon</Text>
              <Text style={styles.emptySub}>Pro-level programs are in development</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Grid view (no scroll — fits one screen) ───────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TRAINING</Text>
          <Text style={styles.title}>Programs</Text>
        </View>

        {/* Grid — flex: 4, takes ~65% of remaining height */}
        <View style={styles.gridArea}>
          {GRID_ROWS.map((row, idx) => (
            <View key={idx} style={styles.gridRow}>
              {row.map((key) => (
                <CategoryCard key={key} gridKey={key} onPress={() => handleGridTap(key)} />
              ))}
            </View>
          ))}
        </View>

        {/* Bottom — flex: 2, takes ~35% of remaining height */}
        <View style={styles.bottomArea}>

          {/* Recommended */}
          <View style={[styles.recCard, { borderTopColor: suggestedMeta.color }]}>
            <Text style={[styles.recEyebrow, { color: suggestedMeta.color }]}>
              RECOMMENDED FOR YOU
            </Text>
            <View style={styles.recMiddle}>
              <View style={[styles.recIconWrap, { backgroundColor: `${suggestedMeta.color}1A` }]}>
                <Ionicons name={suggestedIcon as any} size={20} color={suggestedMeta.color} />
              </View>
              <View style={styles.recTextCol}>
                <Text style={styles.recName} numberOfLines={1}>{suggested.program.name}</Text>
                <Text style={styles.recReason} numberOfLines={1}>{suggested.reason}</Text>
              </View>
            </View>
            <View style={styles.recBottom}>
              <View style={styles.recDurationBadge}>
                <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.recDurationTxt}>{suggested.program.estimatedMinutes} min</Text>
              </View>
              <TouchableOpacity
                style={[styles.recStartBtn, { backgroundColor: suggestedMeta.color }]}
                onPress={() => handleStart(suggested.program)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={11} color="#fff" />
                <Text style={styles.recStartTxt}>Start Session</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Coaching tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipIconWrap}>
                <Ionicons name="bulb-outline" size={15} color={Colors.brand} />
              </View>
              <Text style={styles.tipLabel}>COACHING TIP</Text>
            </View>
            <Text style={styles.tipText} numberOfLines={3}>{todayTip}</Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1 },

  // ── Header
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  eyebrow: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold,
    color: Colors.accentRoutines, letterSpacing: 1.5, marginBottom: 2,
  },
  title: {
    fontSize: 26, fontWeight: FontWeight.black,
    color: Colors.textPrimary, letterSpacing: -0.5,
  },

  // ── Grid — flex: 4 (takes most of the screen height)
  gridArea: {
    flex: 4,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Category card — flex: 1 within row
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderTopWidth: 3,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm,
    ...Shadow.sm,
  },
  cardIconRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardName: {
    fontSize: 17, fontWeight: FontWeight.black,
    color: Colors.textPrimary, letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 10, color: Colors.textMuted,
    lineHeight: 14, marginBottom: Spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto' as any,
  },
  badge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: FontWeight.bold },

  // ── Bottom — flex: 2 (takes remaining ~35%)
  bottomArea: {
    flex: 2,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
    gap: Spacing.sm,
  },

  // Recommended card — flex: 1 within bottomArea
  recCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderTopWidth: 3,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  recEyebrow: {
    fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.3,
    marginBottom: Spacing.xs,
  },
  recMiddle: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, flex: 1,
    marginBottom: Spacing.xs,
  },
  recIconWrap: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  recTextCol: { flex: 1 },
  recName: {
    fontSize: FontSize.label, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, marginBottom: 3,
  },
  recReason: { fontSize: FontSize.caption, color: Colors.textMuted },
  recBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  recDurationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  recDurationTxt: {
    fontSize: FontSize.caption, color: Colors.textMuted, fontWeight: FontWeight.medium,
  },
  recStartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  recStartTxt: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: '#fff',
  },

  // Coaching tip card — flex: 1 within bottomArea
  tipCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, borderLeftColor: Colors.brand,
    padding: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs, marginBottom: Spacing.sm,
  },
  tipIconWrap: {
    width: 26, height: 26, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  tipLabel: {
    fontSize: 9, fontWeight: FontWeight.bold,
    color: Colors.brand, letterSpacing: 1.2,
  },
  tipText: {
    fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18,
  },

  // ── Detail view
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  detailHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailDot:   { width: 10, height: 10, borderRadius: 5 },
  detailTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  detailContent: { paddingTop: Spacing.base, paddingBottom: Spacing.xxxl },
  detailBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginBottom: Spacing.base,
    padding: Spacing.md, gap: Spacing.md,
    borderRadius: BorderRadius.xl, borderWidth: 1,
  },
  detailBannerIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  detailBannerText:  { flex: 1 },
  detailBannerLevel: { fontSize: FontSize.label, fontWeight: FontWeight.bold },
  detailBannerDesc:  { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },
  detailBannerCount: { fontSize: 28, fontWeight: FontWeight.black },

  // Program card
  programCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  programAccent: { width: 4, alignSelf: 'stretch' },
  programIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.sm, marginVertical: Spacing.md,
  },
  programBody:   { flex: 1, paddingVertical: Spacing.md, paddingLeft: Spacing.sm },
  programTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  programName: {
    fontSize: FontSize.label, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm,
  },
  durationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: BorderRadius.sm,
  },
  durationText: { fontSize: FontSize.micro, color: Colors.textMuted, fontWeight: FontWeight.medium },
  programDesc:  { fontSize: 12, color: Colors.textMuted, lineHeight: 16, marginBottom: 6 },
  programMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTag: {
    fontSize: 9, fontWeight: FontWeight.semiBold,
    color: Colors.textMuted, textTransform: 'uppercase',
  },
  metaDot: { fontSize: 9, color: Colors.textMuted, opacity: 0.4 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.md,
  },

  // Empty state
  emptyState:   { alignItems: 'center', paddingVertical: Spacing.huge },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  emptySub:   { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});
