import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius, ButtonHeight } from '../../constants/layout';
import PillSelector from '../../components/ui/PillSelector';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProfileStore } from '../../stores/profileStore';
import {
  SessionConfig, DrillType, CourtSystem, CoverageMode,
  PatternType, ShotGroup, Tempo, Difficulty, RestMode, VoiceMode,
} from '../../types';
import { getIntervalMs } from '../../constants/timing';
import { COVERAGE_FILTER, POSITIONS_6PT, POSITIONS_10PT } from '../../constants/positions';

// ─── Step option type ─────────────────────────────────────────────────────────

type StepOption = {
  value: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  comingSoon?: boolean;
  lockedReason?: string;  // set → option visible but not selectable; shows lock badge
};

// ─── Step data ────────────────────────────────────────────────────────────────

const DRILL_TYPE_OPTS: StepOption[] = [
  { value: 'movement',   title: 'Movement Only',    desc: 'Pure ghosting footwork with no shot calls. Focus entirely on court coverage and speed.',                       icon: 'walk',   iconColor: Colors.accentProgress, iconBg: `${Colors.accentProgress}22` },
  { value: 'shot-based', title: 'Shot Training',    desc: 'Ghosting with voice shot calls. Choose your shot groups — drives, drops, boasts and more.',                    icon: 'golf',   iconColor: Colors.brand,          iconBg: Colors.brandMuted },
  { value: 'match-sim',  title: 'Match Simulation', desc: 'Predefined rally sequences that mirror real match play. Trains realistic point-play court movement patterns.', icon: 'trophy', iconColor: Colors.gold,           iconBg: `${Colors.gold}22` },
];

const DIFFICULTY_OPTS: StepOption[] = [
  { value: 'beginner',     title: 'Beginner',     desc: 'Simple patterns, 6-point court, one shot per position.',                    icon: 'leaf',    iconColor: Colors.levelBeginner,     iconBg: `${Colors.levelBeginner}22` },
  { value: 'intermediate', title: 'Intermediate', desc: '2–3 shot options, semi-random patterns.',                                    icon: 'trending-up', iconColor: Colors.levelIntermediate, iconBg: `${Colors.levelIntermediate}22` },
  { value: 'advanced',     title: 'Advanced',     desc: 'Full shot variety, 10-point court recommended.',                             icon: 'flash',   iconColor: Colors.levelAdvanced,     iconBg: `${Colors.levelAdvanced}22` },
  { value: 'elite',        title: 'Elite',        desc: 'Fully random, all shots, fastest timing.',                                   icon: 'medal',   iconColor: Colors.levelElite,        iconBg: `${Colors.levelElite}22` },
  { value: 'pro',          title: 'Pro',          desc: 'Competition-level pace — maximum speed and variety.',                        icon: 'diamond', iconColor: Colors.levelPro,          iconBg: `${Colors.levelPro}22` },
];

const COVERAGE_OPTS: StepOption[] = [
  { value: 'full',     title: 'Full Court',  desc: 'All positions — maximum court range.',          icon: 'apps',       iconColor: Colors.textSecondary, iconBg: Colors.surfaceElevated },
  { value: 'front',    title: 'Front Court', desc: 'Drops, volleys and front corners only.',         icon: 'arrow-up',   iconColor: Colors.brand,         iconBg: Colors.brandMuted },
  { value: 'back',     title: 'Back Court',  desc: 'Length, back corners and boasts.',               icon: 'arrow-down', iconColor: Colors.accentRoutines, iconBg: `${Colors.accentRoutines}22` },
  { value: 'forehand', title: 'Forehand',    desc: 'Dominant-hand side positions only.',             icon: 'hand-right', iconColor: Colors.gold,          iconBg: `${Colors.gold}22` },
  { value: 'backhand', title: 'Backhand',    desc: 'Off-hand side — build your weakness.',           icon: 'hand-left',  iconColor: Colors.accentProgress, iconBg: `${Colors.accentProgress}22` },
];

const COURT_SYSTEM_OPTS: StepOption[] = [
  { value: '6pt',  title: '6-Point',  desc: 'Classic corners + T — works for all levels.',          icon: 'grid',  iconColor: Colors.accentRoutines, iconBg: `${Colors.accentRoutines}22` },
  { value: '10pt', title: '10-Point', desc: 'Adds 4 mid-diagonal positions — Advanced & above.',     icon: 'apps',  iconColor: Colors.brand,          iconBg: Colors.brandMuted },
];

const PATTERN_OPTS_ALL: StepOption[] = [
  { value: 'random',     title: 'Random',     desc: 'Unpredictable sequence — simulates a real match.', icon: 'shuffle', iconColor: Colors.brand,          iconBg: Colors.brandMuted },
  { value: 'fixed',      title: 'Fixed',      desc: 'Repeating sequence — drill and groove a pattern.',  icon: 'list',    iconColor: Colors.accentProgress, iconBg: `${Colors.accentProgress}22` },
  { value: 'shot-based', title: 'Shot-Based', desc: 'Sequence driven by your shot group selection.',     icon: 'golf',    iconColor: Colors.accentRoutines, iconBg: `${Colors.accentRoutines}22` },
];


const DURATION_OPTIONS = [
  { label: '5 min',  value: '5'  },
  { label: '10 min', value: '10' },
  { label: '15 min', value: '15' },
  { label: '20 min', value: '20' },
  { label: '25 min', value: '25' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
];

const TEMPO_OPTIONS = [
  { label: 'Slow', value: 'slow' }, { label: 'Natural', value: 'natural' }, { label: 'Explosive', value: 'explosive' },
];

const REST_MODE_OPTIONS = [
  { label: 'Auto (40% of set)', value: 'auto' },
  { label: 'Manual', value: 'manual' },
  { label: 'No Rest', value: 'none' },
];

const REST_SECONDS_OPTIONS = [
  { label: '5s',  value: '5'  },
  { label: '10s', value: '10' },
  { label: '15s', value: '15' },
  { label: '20s', value: '20' },
  { label: '30s', value: '30' },
  { label: '45s', value: '45' },
  { label: '60s', value: '60' },
  { label: '90s', value: '90' },
];

const VOICE_MODE_OPTIONS = [
  { label: 'Voice + Visual', value: 'voice+visual' },
  { label: 'Voice Only',     value: 'voice-only'   },
  { label: 'Visual Only',    value: 'visual-only'  },
  { label: 'Beep Only',      value: 'beep'         },
];

// ─── Constraint engine ────────────────────────────────────────────────────────

// Shot groups relevant to each coverage mode.
// Irrelevant groups are dimmed and blocked in the shot group selector.
const COVERAGE_SHOT_GROUPS: Record<CoverageMode, ShotGroup[]> = {
  full:     ['mixed', 'drives', 'lengths', 'drops', 'kills', 'lobs', 'boasts', 'volleys', 'deception'],
  front:    ['mixed', 'drops', 'kills', 'lobs', 'volleys', 'deception'],
  back:     ['mixed', 'drives', 'lengths', 'lobs', 'boasts', 'deception'],
  forehand: ['mixed', 'drives', 'lengths', 'drops', 'kills', 'lobs', 'boasts', 'volleys', 'deception'],
  backhand: ['mixed', 'drives', 'lengths', 'drops', 'kills', 'lobs', 'boasts', 'volleys', 'deception'],
};

// Applies coverage-aware locks to drill type options.
// Match Simulation requires the full court — lock it when a zone is selected.
function buildDrillTypeOpts(coverage: CoverageMode): StepOption[] {
  return DRILL_TYPE_OPTS.map((opt) =>
    opt.value === 'match-sim' && coverage !== 'full'
      ? { ...opt, lockedReason: 'Full Court only' }
      : opt
  );
}

// ─── Step routing ─────────────────────────────────────────────────────────────
// Coverage is Step 1 — it is the primary zone constraint that filters every
// downstream step. Steps are ordered: zone first, then how to train within it.

const STEPS_BASE     = ['coverage', 'drillType', 'difficulty', 'courtSystem', 'pattern', 'session'] as const;
const STEPS_MATCHSIM = ['coverage', 'drillType', 'difficulty', 'courtSystem',            'session'] as const;
type StepKey = typeof STEPS_BASE[number];

const STEP_HEADING: Record<StepKey, string> = {
  coverage:    'Which court area will you train?',
  drillType:   'How do you want to train today?',
  difficulty:  'Choose your difficulty level',
  courtSystem: 'Choose your court layout',
  pattern:     'How should positions sequence?',
  session:     'Set up your session',
};

const STEP_SUBLABEL: Record<StepKey, string> = {
  coverage:    'Court Zone',
  drillType:   'Drill Type',
  difficulty:  'Difficulty',
  courtSystem: 'Court System',
  pattern:     'Pattern & Shots',
  session:     'Session Setup',
};

const STEP_SUB: Record<StepKey, string> = {
  coverage:    'Your zone selection constrains all available drill options in the next steps.',
  drillType:   '',
  difficulty:  'This affects shot variety, timing & position count.',
  courtSystem: '',
  pattern:     'Controls how positions are called and sequenced.',
  session:     'Duration, tempo, rest and voice preferences.',
};

// Label shown in the active-zone constraint banner on steps 2–6
const COVERAGE_LABEL: Record<CoverageMode, string> = {
  full:     'Full Court',
  front:    'Front Court',
  back:     'Back Court',
  forehand: 'Forehand Court',
  backhand: 'Backhand Court',
};

// ─── Option card ─────────────────────────────────────────────────────────────

function OptionCard({ option, selected, onPress }: {
  option: StepOption; selected: boolean; onPress: () => void;
}) {
  const isLocked = !!option.lockedReason;
  return (
    <TouchableOpacity
      style={[
        ocStyles.card,
        selected && !isLocked && ocStyles.selected,
        (option.comingSoon || isLocked) && ocStyles.cardDim,
      ]}
      onPress={isLocked ? undefined : onPress}
      activeOpacity={isLocked ? 1 : 0.75}
    >
      <View style={[ocStyles.iconBox, { backgroundColor: selected && !isLocked ? `${Colors.brand}22` : option.iconBg }]}>
        <Ionicons name={option.icon} size={26} color={selected && !isLocked ? Colors.brand : option.iconColor} />
      </View>
      <View style={ocStyles.textBlock}>
        <View style={ocStyles.titleRow}>
          <Text style={[ocStyles.title, selected && !isLocked && ocStyles.titleSel]}>{option.title}</Text>
          {option.comingSoon && (
            <View style={ocStyles.comingSoonBadge}>
              <Text style={ocStyles.comingSoonText}>COMING SOON</Text>
            </View>
          )}
          {isLocked && (
            <View style={ocStyles.lockedBadge}>
              <Ionicons name="lock-closed" size={8} color={Colors.textMuted} />
              <Text style={ocStyles.lockedText}>{option.lockedReason}</Text>
            </View>
          )}
        </View>
        <Text style={ocStyles.desc}>{option.desc}</Text>
      </View>
      {isLocked
        ? <Ionicons name="lock-closed-outline" size={18} color={Colors.textDisabled} />
        : (
          <View style={[ocStyles.check, selected && ocStyles.checkSel]}>
            {selected && <Ionicons name="checkmark" size={12} color={Colors.textPrimary} />}
          </View>
        )
      }
    </TouchableOpacity>
  );
}

const ocStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selected: { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  iconBox:  { width: 56, height: 56, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  textBlock:{ flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  title:    { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  titleSel: { color: Colors.brand },
  desc:     { fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 17 },
  check:    { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkSel: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  cardDim:  { opacity: 0.55 },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  lockedText: { fontSize: 8, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 0.5 },
  comingSoonBadge: {
    backgroundColor: `${Colors.gold}22`,
    borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: `${Colors.gold}55`,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  comingSoonText: {
    fontSize: 8, fontWeight: FontWeight.bold, color: Colors.gold, letterSpacing: 0.8,
  },
});

// ─── Shot group grid ─────────────────────────────────────────────────────────

const SHOT_ITEMS = [
  { label: 'Mixed (all)', value: 'mixed',     icon: 'shuffle'              },
  { label: 'Drives',      value: 'drives',    icon: 'arrow-up'             },
  { label: 'Lengths',     value: 'lengths',   icon: 'git-branch'           },
  { label: 'Drops',       value: 'drops',     icon: 'arrow-down'           },
  { label: 'Kills',       value: 'kills',     icon: 'flame'                },
  { label: 'Lobs',        value: 'lobs',      icon: 'cloud'                },
  { label: 'Boasts',      value: 'boasts',    icon: 'return-down-forward'  },
  { label: 'Volleys',     value: 'volleys',   icon: 'flash'                },
  { label: 'Deception',   value: 'deception', icon: 'eye-off'              },
] as const;

function ShotGroupSelector({
  selectedGroups,
  onSelect,
  allowedGroups,
}: {
  selectedGroups: ShotGroup[];
  onSelect: (v: string) => void;
  allowedGroups: ShotGroup[];
}) {
  return (
    <View style={sgStyles.grid}>
      {SHOT_ITEMS.map((item) => {
        const isAllowed = allowedGroups.includes(item.value as ShotGroup);
        const active    = isAllowed && selectedGroups.includes(item.value as ShotGroup);
        return (
          <TouchableOpacity
            key={item.value}
            style={[sgStyles.chip, active && sgStyles.chipActive, !isAllowed && sgStyles.chipLocked]}
            onPress={() => isAllowed && onSelect(item.value)}
            activeOpacity={isAllowed ? 0.75 : 1}
          >
            <Ionicons
              name={item.icon as any}
              size={14}
              color={active ? Colors.brand : isAllowed ? Colors.textMuted : Colors.textDisabled}
            />
            <Text style={[sgStyles.chipLabel, active && sgStyles.chipLabelActive, !isAllowed && sgStyles.chipLabelLocked]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const sgStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive:      { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  chipLocked:      { opacity: 0.35, borderColor: Colors.surfaceElevated },
  chipLabel:       { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted },
  chipLabelActive: { color: Colors.brand },
  chipLabelLocked: { color: Colors.textDisabled },
});

// ─── Context info card ────────────────────────────────────────────────────────

function TipCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={tipStyles.card}>
      <View style={tipStyles.iconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.accentProgress} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tipStyles.title}>{title}</Text>
        <Text style={tipStyles.body}>{body}</Text>
      </View>
    </View>
  );
}

const tipStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: `${Colors.accentProgress}0E`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: `${Colors.accentProgress}25`,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: BorderRadius.sm,
    backgroundColor: `${Colors.accentProgress}18`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  body:  { fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 18 },
});

// ─── Pattern tip lookup ───────────────────────────────────────────────────────

const PATTERN_TIP: Record<string, { title: string; body: string }> = {
  random:      { title: 'Random Sequence', body: 'Every call is unpredictable — exactly like a real match. Best for building reaction speed and match-readiness.' },
  fixed:       { title: 'Fixed Sequence',  body: 'Positions repeat in the same order. Drill a specific movement pattern until it becomes muscle memory.' },
  'shot-based':{ title: 'Shot-Based Flow', body: 'Positions are driven by your selected shot groups. Combines court movement with shot-type decision making.' },
};

function CompactSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: Spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function IntervalPreview({ difficulty, tempo, extraMs = 0 }: { difficulty: Difficulty; tempo: Tempo; extraMs?: number }) {
  const ms = getIntervalMs(difficulty, tempo) + extraMs;
  const perMin = Math.round(60_000 / ms);
  return (
    <View style={{ backgroundColor: Colors.brandSoft, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginBottom: Spacing.lg, alignItems: 'center' }}>
      <Text style={{ fontSize: FontSize.caption, color: Colors.brand, fontWeight: FontWeight.semiBold }}>
        {(ms / 1000).toFixed(1)}s between calls · ≈ {perMin} reps/min
      </Text>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function DrillConfigModal() {
  const { drillConfigVisible, closeDrillConfig, setPendingConfig } = useSessionStore();
  const settings = useSettingsStore((s) => s.settings);
  const { profile }  = useProfileStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [drillType,   setDrillType]   = useState<DrillType>(settings.defaultDrillType);
  const [courtSystem, setCourtSystem] = useState<CourtSystem>(settings.defaultCourtSystem);
  const [coverage,    setCoverage]    = useState<CoverageMode>('full');
  // 'shot-based' patternType is no longer shown in the UI for shot-based drillType.
  // Always start at 'random' — the engine applies shot filtering automatically.
  const [patternType, setPatternType] = useState<PatternType>('random');
  const [shotGroups,  setShotGroups]  = useState<ShotGroup[]>(['mixed']);
  const [duration,    setDuration]    = useState<number>(settings.defaultDuration);
  const [tempo,       setTempo]       = useState<Tempo>(settings.defaultTempo);
  const [difficulty,  setDifficulty]  = useState<Difficulty>(settings.defaultDifficulty);
  const [restMode,    setRestMode]    = useState<RestMode>('auto');
  const [restSeconds, setRestSeconds] = useState<number>(15);
  const [voiceMode,   setVoiceMode]   = useState<VoiceMode>(settings.defaultVoiceMode);

  // Reset step and voice mode on each open; keep other selections as defaults
  // so backing out of step 1 and reopening doesn't lose drill/difficulty choices.
  useEffect(() => {
    if (drillConfigVisible) {
      setCurrentStep(1);
      setVoiceMode(settings.defaultVoiceMode);
    }
  }, [drillConfigVisible]);

  const steps      = drillType === 'match-sim' ? STEPS_MATCHSIM : STEPS_BASE;
  const totalSteps = steps.length;
  const stepKey    = steps[currentStep - 1] as StepKey;
  const isLastStep = currentStep === totalSteps;

  // ── Constraint engine ────────────────────────────────────────────────────────
  const allowedShotGroups  = COVERAGE_SHOT_GROUPS[coverage];
  const drillTypeOpts      = buildDrillTypeOpts(coverage);
  const showZoneBanner     = stepKey !== 'coverage' && coverage !== 'full';

  // Shot Training shows the shot groups selector; Movement Only does not.
  const showShots = drillType === 'shot-based';
  // Shot-Based Training already implies position filtering by shot group — the
  // "Shot-Based" pattern option would be circular. Movement Only has no shots at all.
  // Neither needs the "Shot-Based" pattern in the list.
  const patternOpts = PATTERN_OPTS_ALL.filter((p) =>
    p.value !== 'shot-based' || (drillType !== 'shot-based' && drillType !== 'movement')
  );

  function handleCoverageChange(next: CoverageMode) {
    setCoverage(next);
    // Auto-reset match-sim to movement when switching to a non-full zone
    // (match-sim is locked to full court — enforced by UI but defended here too)
    if (next !== 'full' && drillType === 'match-sim') {
      setDrillType('movement');
      setPatternType('random');
    }
    // Strip shot groups that aren't valid for the new zone
    const allowed = COVERAGE_SHOT_GROUPS[next];
    const valid   = shotGroups.filter((g) => allowed.includes(g));
    setShotGroups(valid.length > 0 ? valid : ['mixed']);
  }

  function handleNext() {
    if (isLastStep) { handleStart(); return; }
    setCurrentStep((s) => s + 1);
  }
  function handleBack() {
    if (currentStep === 1) { closeDrillConfig(); return; }
    setCurrentStep((s) => s - 1);
  }
  function handleStart() {
    // match-sim skips the pattern step, so patternType stays at its default 'random'.
    // Enforce the correct patternType so the engine uses rally templates.
    const effectivePatternType: PatternType =
      drillType === 'match-sim' ? 'match-sim' : patternType;

    const config: SessionConfig = {
      drillType, courtSystem, coverage,
      patternType: effectivePatternType,
      shotGroups, duration, tempo, difficulty, restMode, restSeconds, voiceMode,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
    };
    closeDrillConfig();
    setTimeout(() => setPendingConfig(config), 300);
  }
  function handleShotGroupSelect(value: string) {
    const sg = value as ShotGroup;
    if (sg === 'mixed') { setShotGroups(['mixed']); return; }
    const without = shotGroups.filter((g) => g !== 'mixed');
    if (without.includes(sg)) {
      const next = without.filter((g) => g !== sg);
      setShotGroups(next.length === 0 ? ['mixed'] : next);
    } else {
      setShotGroups([...without, sg]);
    }
  }

  const nextEnabled = true;

  return (
    <Modal
      visible={drillConfigVisible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={closeDrillConfig}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── ORANGE HEADER BAR ─────────────────────────────── */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={currentStep === 1 ? 'close' : 'arrow-back'}
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Setup Training</Text>
          <Text style={styles.headerStep}>Step {currentStep} of {totalSteps}</Text>
        </View>

        {/* ── PROGRESS TRACK ────────────────────────────────── */}
        <View style={styles.trackRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.trackSeg, { backgroundColor: i < currentStep ? Colors.brand : Colors.surfaceElevated }]}
            />
          ))}
        </View>

        {/* ── STEP CONTENT ──────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Active zone constraint banner ─────────────────── */}
          {showZoneBanner && (
            <View style={styles.zoneBanner}>
              <Ionicons name="lock-closed-outline" size={12} color={Colors.brand} />
              <Text style={styles.zoneBannerText}>
                Zone: <Text style={styles.zoneBannerZone}>{COVERAGE_LABEL[coverage]}</Text>
                {'  ·  '}options filtered to this area
              </Text>
            </View>
          )}

          <Text style={styles.stepHeading}>{STEP_HEADING[stepKey]}</Text>
          {STEP_SUB[stepKey] ? (
            <Text style={styles.stepSub}>{STEP_SUB[stepKey]}</Text>
          ) : null}

          {stepKey === 'drillType' && drillTypeOpts.map((opt) => (
            <OptionCard key={opt.value} option={opt}
              selected={drillType === opt.value}
              onPress={() => {
                if (opt.lockedReason) return;
                const newType = opt.value as DrillType;
                setDrillType(newType);
                // Pre-set the most meaningful patternType for each drill type.
                // 'shot-based' pattern is hidden for shot-based drillType (redundant),
                // so default it to 'random' which applies shot-group filtering automatically.
                if (newType === 'shot-based' || newType === 'movement') setPatternType('random');
                // Clamp step to the valid range of the new drill type's step sequence.
                // match-sim has 5 steps; all others have 6. Switching must not leave
                // currentStep out of bounds, but it should NOT reset to step 1.
                const newSteps = newType === 'match-sim' ? STEPS_MATCHSIM : STEPS_BASE;
                setCurrentStep((s) => Math.min(s, newSteps.length));
              }}
            />
          ))}

          {/* Difficulty — 2-col grid */}
          {stepKey === 'difficulty' && (
            <View style={styles.diffGrid}>
              {DIFFICULTY_OPTS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.diffCard, difficulty === opt.value && styles.diffCardSel]}
                  onPress={() => setDifficulty(opt.value as Difficulty)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={24}
                    color={difficulty === opt.value ? Colors.brand : opt.iconColor}
                  />
                  <Text style={[styles.diffTitle, difficulty === opt.value && styles.diffTitleSel]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.diffDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Coverage — Step 1: primary zone constraint */}
          {stepKey === 'coverage' && (
            <>
              {COVERAGE_OPTS.map((opt) => (
                <OptionCard key={opt.value} option={opt}
                  selected={coverage === opt.value}
                  onPress={() => handleCoverageChange(opt.value as CoverageMode)}
                />
              ))}
            </>
          )}

          {/* Court System */}
          {stepKey === 'courtSystem' && (() => {
            const zoneFilter = (COVERAGE_FILTER[coverage] ?? POSITIONS_10PT) as string[];
            const pos6  = POSITIONS_6PT.filter(p => zoneFilter.includes(p) && p !== 'T');
            const pos10 = POSITIONS_10PT.filter(p => zoneFilter.includes(p) && p !== 'T');
            const count6  = pos6.length;
            const count10 = pos10.length;
            const tooFew6 = coverage !== 'full' && count6 <= 2;
            return (
              <>
                {COURT_SYSTEM_OPTS.map((opt) => {
                  const count = opt.value === '6pt' ? count6 : count10;
                  const tooFew = opt.value === '6pt' && tooFew6;
                  const badgeLabel = coverage !== 'full' ? `${count} position${count !== 1 ? 's' : ''} in zone` : undefined;
                  return (
                    <View key={opt.value}>
                      <OptionCard
                        option={tooFew ? { ...opt, lockedReason: 'Only 2 positions — use 10-Point' } : opt}
                        selected={courtSystem === opt.value}
                        onPress={() => setCourtSystem(opt.value as CourtSystem)}
                      />
                      {badgeLabel && !tooFew && (
                        <Text style={styles.posCountBadge}>{badgeLabel}</Text>
                      )}
                    </View>
                  );
                })}
                <TipCard
                  icon={courtSystem === '10pt' ? 'grid-outline' : 'apps-outline'}
                  title={courtSystem === '10pt' ? '10-Point: Advanced coverage' : '6-Point: The classic layout'}
                  body={courtSystem === '10pt'
                    ? 'Adds 4 mid-diagonal positions to the 6 corners + T. Trains more realistic angles and court movement — recommended for Advanced level and above.'
                    : '6 positions: 4 corners, the T, and the front centre. The standard ghosting layout used at all levels. Simple to learn, hard to master.'
                  }
                />
                {tooFew6 && courtSystem === '6pt' && (
                  <TipCard
                    icon="warning-outline"
                    title="6-Point gives only 2 positions in this zone"
                    body={`${COVERAGE_LABEL[coverage]} with 6-Point = ${pos6.map(p => p).join(' + ')} only. Switch to 10-Point for a meaningful zone drill (${count10} positions).`}
                  />
                )}
              </>
            );
          })()}

          {/* Pattern + Shots */}
          {stepKey === 'pattern' && (
            <>
              {patternOpts.map((opt) => (
                <OptionCard key={opt.value} option={opt}
                  selected={patternType === opt.value}
                  onPress={() => setPatternType(opt.value as PatternType)}
                />
              ))}
              {showShots && (
                <CompactSection title={`SHOT GROUPS  (multi-select)${coverage !== 'full' ? '  ·  filtered to zone' : ''}`}>
                  <ShotGroupSelector
                    selectedGroups={shotGroups}
                    onSelect={handleShotGroupSelect}
                    allowedGroups={allowedShotGroups}
                  />
                </CompactSection>
              )}
              {!showShots && PATTERN_TIP[patternType] && (
                <TipCard
                  icon="information-circle-outline"
                  title={PATTERN_TIP[patternType].title}
                  body={PATTERN_TIP[patternType].body}
                />
              )}
            </>
          )}

          {/* Session Setup */}
          {stepKey === 'session' && (
            <>
              <CompactSection title="DURATION">
                <PillSelector options={DURATION_OPTIONS} selected={String(duration)}
                  onSelect={(v) => setDuration(Number(v))} scrollable />
              </CompactSection>
              <CompactSection title="TEMPO">
                <PillSelector options={TEMPO_OPTIONS} selected={tempo}
                  onSelect={(v) => setTempo(v as Tempo)} />
              </CompactSection>
              <IntervalPreview difficulty={difficulty} tempo={tempo} extraMs={settings.movementPaceExtraMs ?? 0} />
              <CompactSection title="REST INTERVAL">
                <PillSelector options={REST_MODE_OPTIONS} selected={restMode}
                  onSelect={(v) => setRestMode(v as RestMode)} />
                {restMode === 'manual' && (
                  <View style={styles.restRow}>
                    <Text style={styles.restLabel}>Duration:</Text>
                    <PillSelector options={REST_SECONDS_OPTIONS} selected={String(restSeconds)}
                      onSelect={(v) => setRestSeconds(Number(v))} scrollable />
                  </View>
                )}
                {restMode === 'none' && (
                  <Text style={styles.hint}>No rest between sets — continuous training.</Text>
                )}
              </CompactSection>
              <CompactSection title="VOICE MODE">
                <PillSelector options={VOICE_MODE_OPTIONS} selected={voiceMode}
                  onSelect={(v) => setVoiceMode(v as VoiceMode)} scrollable />
              </CompactSection>
            </>
          )}
        </ScrollView>

        {/* ── FOOTER NEXT / START ───────────────────────────── */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextBtn, isLastStep && styles.startBtn, !nextEnabled && styles.disabledBtn]}
            activeOpacity={0.85}
            disabled={!nextEnabled}
          >
            <Text style={styles.nextBtnText}>
              {isLastStep ? '▶  START SESSION' : `Next  →`}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Orange header bar — matches reference exactly
  headerBar: {
    backgroundColor: Colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerStep:  { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.75)', fontWeight: FontWeight.medium },

  // Progress track: dots connected by line
  trackRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  trackSeg: { flex: 1, height: 3, borderRadius: 2 },

  content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },

  stepHeading: {
    fontSize: FontSize.title + 2,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  stepSub: {
    fontSize: FontSize.label,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },

  // Active zone constraint banner (shows on steps 2–6 when coverage ≠ full)
  zoneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.brandSoft,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.borderBrand,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  zoneBannerText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  zoneBannerZone: { color: Colors.brand, fontWeight: FontWeight.bold },

  posCountBadge: {
    fontSize: FontSize.micro, color: Colors.brand, fontWeight: FontWeight.semiBold,
    marginTop: -Spacing.xs, marginBottom: Spacing.sm, marginLeft: Spacing.sm,
    letterSpacing: 0.3,
  },

  hint: {
    fontSize: FontSize.caption, color: Colors.accentProgress,
    marginTop: Spacing.xs, paddingHorizontal: Spacing.xs, lineHeight: 18,
  },

  // Difficulty 2-col grid
  diffGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  diffCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  diffCardSel: { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  diffTitle:   { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  diffTitleSel:{ color: Colors.brand },
  diffDesc:    { fontSize: FontSize.micro, color: Colors.textMuted, lineHeight: 16 },

  restRow:   { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  restLabel: { fontSize: FontSize.label, color: Colors.textSecondary, width: 72 },

  warnCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: `${Colors.gold}18`,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: `${Colors.gold}44`,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  warnText: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },

  footer: {
    padding: Spacing.base,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    height: ButtonHeight.xl,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  startBtn:    { backgroundColor: Colors.brand },
  disabledBtn: { opacity: 0.5 },
  nextBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
});
