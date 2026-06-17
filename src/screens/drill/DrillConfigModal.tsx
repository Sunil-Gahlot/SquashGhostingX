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

// ─── Step option type ─────────────────────────────────────────────────────────

type StepOption = {
  value: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

// ─── Step data ────────────────────────────────────────────────────────────────

const DRILL_TYPE_OPTS: StepOption[] = [
  { value: 'shot-based', title: 'Shot-Based Training', desc: 'Movement drills with shot-type voice calls. e.g. "Move to Front Left and hit Drive".', icon: 'golf',      iconColor: Colors.brand,          iconBg: Colors.brandMuted },
  { value: 'match-sim',  title: 'Match Simulation',    desc: 'Predefined match sequences. Focus on realistic point-play flows.',                     icon: 'trophy',    iconColor: Colors.gold,           iconBg: `${Colors.gold}22` },
  { value: 'movement',   title: 'Movement Only',       desc: 'Pure ghosting footwork. Focus purely on court coverage without any shot calls.',        icon: 'walk',      iconColor: Colors.accentProgress, iconBg: `${Colors.accentProgress}22` },
  { value: 'custom',     title: 'Custom Drill',        desc: 'Build your own routine. Pick specific positions and shots for a tailored session.',     icon: 'construct', iconColor: Colors.accentLibrary,  iconBg: `${Colors.accentLibrary}22` },
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

const SHOT_GROUP_OPTIONS = [
  { label: 'Mixed (all)',  value: 'mixed'       },
  { label: 'Drives',       value: 'drives'      },
  { label: 'Rails',        value: 'rails'       },
  { label: 'Cross Shots',  value: 'cross'       },
  { label: 'Diagonals',    value: 'diagonals'   },
  { label: 'Drops',        value: 'drops'       },
  { label: 'Front Court',  value: 'front-court' },
  { label: 'Volleys',      value: 'volleys'     },
  { label: 'Boasts',       value: 'boasts'      },
  { label: 'Lobs',         value: 'lobs'        },
  { label: 'Kill Shots',   value: 'kills'       },
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
  { label: 'Auto (40% of set)', value: 'auto' }, { label: 'Manual', value: 'manual' },
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

// ─── Step routing ─────────────────────────────────────────────────────────────

const STEPS_FULL     = ['drillType', 'difficulty', 'coverage', 'courtSystem', 'pattern', 'session'] as const;
const STEPS_MATCHSIM = ['drillType', 'difficulty', 'coverage', 'courtSystem',            'session'] as const;
type StepKey = typeof STEPS_FULL[number];

const STEP_HEADING: Record<StepKey, string> = {
  drillType:   'How do you want to train today?',
  difficulty:  'Choose your difficulty level',
  coverage:    'Which zones will you target?',
  courtSystem: 'Choose your court layout',
  pattern:     'How should positions sequence?',
  session:     'Set up your session',
};

const STEP_SUBLABEL: Record<StepKey, string> = {
  drillType:   'Drill Type',
  difficulty:  'Difficulty',
  coverage:    'Coverage',
  courtSystem: 'Court System',
  pattern:     'Pattern & Shots',
  session:     'Session Setup',
};

const STEP_SUB: Record<StepKey, string> = {
  drillType:   '',
  difficulty:  'This affects shot variety, timing & position count.',
  coverage:    'Focus your ghosting on specific court zones.',
  courtSystem: '',
  pattern:     'Controls how positions are called and sequenced.',
  session:     'Duration, tempo, rest and voice preferences.',
};

// ─── Option card ─────────────────────────────────────────────────────────────

function OptionCard({ option, selected, onPress }: {
  option: StepOption; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[ocStyles.card, selected && ocStyles.selected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[ocStyles.iconBox, { backgroundColor: selected ? `${Colors.brand}22` : option.iconBg }]}>
        <Ionicons name={option.icon} size={26} color={selected ? Colors.brand : option.iconColor} />
      </View>
      <View style={ocStyles.textBlock}>
        <Text style={[ocStyles.title, selected && ocStyles.titleSel]}>{option.title}</Text>
        <Text style={ocStyles.desc}>{option.desc}</Text>
      </View>
      <View style={[ocStyles.check, selected && ocStyles.checkSel]}>
        {selected && <Ionicons name="checkmark" size={12} color={Colors.textPrimary} />}
      </View>
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
  title:    { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  titleSel: { color: Colors.brand },
  desc:     { fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 17 },
  check:    { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkSel: { backgroundColor: Colors.brand, borderColor: Colors.brand },
});

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

function IntervalPreview({ difficulty, tempo }: { difficulty: Difficulty; tempo: Tempo }) {
  const ms = getIntervalMs(difficulty, tempo);
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
  const [patternType, setPatternType] = useState<PatternType>('random');
  const [shotGroups,  setShotGroups]  = useState<ShotGroup[]>(['mixed']);
  const [duration,    setDuration]    = useState<number>(settings.defaultDuration);
  const [tempo,       setTempo]       = useState<Tempo>(settings.defaultTempo);
  const [difficulty,  setDifficulty]  = useState<Difficulty>(settings.defaultDifficulty);
  const [restMode,    setRestMode]    = useState<RestMode>('auto');
  const [restSeconds, setRestSeconds] = useState<number>(15);
  const [voiceMode,   setVoiceMode]   = useState<VoiceMode>(settings.defaultVoiceMode);

  useEffect(() => {
    if (drillConfigVisible) {
      setCurrentStep(1);
      setDrillType(settings.defaultDrillType);
      setCourtSystem(settings.defaultCourtSystem);
      setDifficulty(settings.defaultDifficulty);
      setTempo(settings.defaultTempo);
      setDuration(settings.defaultDuration);
      setVoiceMode(settings.defaultVoiceMode);
      setPatternType('random');
      setCoverage('full');
      setShotGroups(['mixed']);
      setRestMode('auto');
      setRestSeconds(15);
    }
  }, [drillConfigVisible]);

  const steps      = drillType === 'match-sim' ? STEPS_MATCHSIM : STEPS_FULL;
  const totalSteps = steps.length;
  const stepKey    = steps[currentStep - 1] as StepKey;
  const isLastStep = currentStep === totalSteps;

  const showShots   = drillType === 'shot-based' || drillType === 'custom';
  const patternOpts = showShots ? PATTERN_OPTS_ALL : PATTERN_OPTS_ALL.filter((p) => p.value !== 'shot-based');

  function handleNext() {
    if (isLastStep) { handleStart(); return; }
    setCurrentStep((s) => s + 1);
  }
  function handleBack() {
    if (currentStep === 1) { closeDrillConfig(); return; }
    setCurrentStep((s) => s - 1);
  }
  function handleStart() {
    const config: SessionConfig = {
      drillType, courtSystem, coverage, patternType, shotGroups,
      duration, tempo, difficulty, restMode, restSeconds, voiceMode,
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
          <Text style={styles.stepHeading}>{STEP_HEADING[stepKey]}</Text>
          {STEP_SUB[stepKey] ? (
            <Text style={styles.stepSub}>{STEP_SUB[stepKey]}</Text>
          ) : null}

          {/* Drill Type */}
          {stepKey === 'drillType' && DRILL_TYPE_OPTS.map((opt) => (
            <OptionCard key={opt.value} option={opt}
              selected={drillType === opt.value}
              onPress={() => setDrillType(opt.value as DrillType)}
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

          {/* Coverage */}
          {stepKey === 'coverage' && COVERAGE_OPTS.map((opt) => (
            <OptionCard key={opt.value} option={opt}
              selected={coverage === opt.value}
              onPress={() => setCoverage(opt.value as CoverageMode)}
            />
          ))}

          {/* Court System */}
          {stepKey === 'courtSystem' && (
            <>
              {COURT_SYSTEM_OPTS.map((opt) => (
                <OptionCard key={opt.value} option={opt}
                  selected={courtSystem === opt.value}
                  onPress={() => setCourtSystem(opt.value as CourtSystem)}
                />
              ))}
              {courtSystem === '10pt' && (
                <Text style={styles.hint}>
                  10-point adds 4 mid-diagonal positions — recommended Advanced+
                </Text>
              )}
            </>
          )}

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
                <CompactSection title="SHOT GROUPS">
                  <PillSelector
                    options={SHOT_GROUP_OPTIONS}
                    selected={shotGroups}
                    onSelect={handleShotGroupSelect}
                    multiSelect
                  />
                </CompactSection>
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
              <IntervalPreview difficulty={difficulty} tempo={tempo} />
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
