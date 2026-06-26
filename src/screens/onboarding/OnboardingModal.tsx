import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius, ButtonHeight } from '../../constants/layout';
import PillSelector from '../../components/ui/PillSelector';
import { useProfileStore } from '../../stores/profileStore';
import { SkillLevel, TrainingGoal, DominantHand, VoiceGender, Language } from '../../types';
import { LANGUAGE_OPTIONS, getLanguageLabel } from '../../constants/languages';
import * as Audio from '../../engine/audioEngine';

// ─── Step options ─────────────────────────────────────────────────────────────

const SKILL_OPTIONS = [
  { label: 'Beginner',     value: 'beginner',     description: 'New to squash ghosting' },
  { label: 'Intermediate', value: 'intermediate', description: 'Regular club player' },
  { label: 'Advanced',     value: 'advanced',     description: 'Competitive club / regional' },
  { label: 'Elite',        value: 'elite',        description: 'Tournament level' },
  { label: 'Pro',          value: 'pro',          description: 'Professional / elite coach' },
];

const GOAL_OPTIONS = [
  { label: 'Fitness',    value: 'fitness',    icon: 'heart-outline'   as const, desc: 'Cardio & endurance'       },
  { label: 'Footwork',   value: 'footwork',   icon: 'walk-outline'    as const, desc: 'Court movement'           },
  { label: 'Match Prep', value: 'match-prep', icon: 'trophy-outline'  as const, desc: 'Competition ready'        },
  { label: 'Speed',      value: 'speed',      icon: 'flash-outline'   as const, desc: 'Explosive pace'           },
  { label: 'Agility',    value: 'agility',    icon: 'repeat-outline'  as const, desc: 'Quick direction changes'  },
];

const { width: SCREEN_W } = Dimensions.get('window');
const GOAL_CARD_W = Math.floor((SCREEN_W - Spacing.xl * 2 - Spacing.sm) / 2);

const HAND_OPTIONS = [
  { label: 'Right-Handed', value: 'right' },
  { label: 'Left-Handed',  value: 'left'  },
];

const VOICE_OPTIONS = [
  { label: 'Female Voice', value: 'female' },
  { label: 'Male Voice',   value: 'male'   },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[dotStyles.dot, i === current && dotStyles.dotActive]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: Spacing.xl },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
});

// ─── Step 1: Skill + Goal ─────────────────────────────────────────────────────

function Step1({
  skill, goal, onSkill, onGoal,
}: {
  skill: SkillLevel; goal: TrainingGoal;
  onSkill: (v: SkillLevel) => void; onGoal: (v: TrainingGoal) => void;
}) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>Welcome to Squash GhostingX</Text>
      <Text style={stepStyles.tagline}>
        {'Train '}
        <Text style={stepStyles.taglineGreen}>Smart.</Text>
        {'  Move '}
        <Text style={stepStyles.taglineOrange}>Faster.</Text>
        {'  Dominate the Court.'}
      </Text>
      <Text style={stepStyles.sub}>Let's personalise your training.</Text>

      {/* Ghosting explainer (PQA-01) */}
      <View style={stepStyles.explainerCard}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.brand} />
        <Text style={stepStyles.explainerText}>
          {'Squash ghosting is solo court movement training — you shadow match footwork without a ball. The app calls positions and tracks your pace.'}
        </Text>
      </View>

      <Text style={stepStyles.sectionLabel}>WHAT'S YOUR LEVEL?</Text>
      <View style={stepStyles.pillWrap}>
        {SKILL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSkill(opt.value as SkillLevel)}
            style={[stepStyles.skillPill, skill === opt.value && stepStyles.skillPillActive]}
          >
            <Text style={[stepStyles.skillLabel, skill === opt.value && stepStyles.skillLabelActive]}>
              {opt.label}
            </Text>
            <Text style={[stepStyles.skillDesc, skill === opt.value && stepStyles.skillDescActive]}>
              {opt.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={stepStyles.sectionLabel}>TRAINING GOAL</Text>
      <View style={stepStyles.goalGrid}>
        {GOAL_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onGoal(opt.value as TrainingGoal)}
            style={[stepStyles.goalCard, goal === opt.value && stepStyles.goalCardActive]}
            activeOpacity={0.75}
          >
            <Ionicons
              name={opt.icon}
              size={24}
              color={goal === opt.value ? Colors.brand : Colors.textMuted}
            />
            <Text style={[stepStyles.goalLabel, goal === opt.value && stepStyles.goalLabelActive]}>
              {opt.label}
            </Text>
            <Text style={[stepStyles.goalDesc, goal === opt.value && stepStyles.goalDescActive]}>
              {opt.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const GENDER_OPTIONS = [
  { label: 'Male',   value: 'male'   },
  { label: 'Female', value: 'female' },
];

// ─── Step 2: Hand + Voice + Name + Age + Gender ───────────────────────────────

function Step2({
  hand, voice, name, age, gender, language,
  onHand, onVoice, onName, onAge, onGender,
}: {
  hand: DominantHand; voice: VoiceGender; name: string; age: string; gender: string; language: Language;
  onHand: (v: DominantHand) => void;
  onVoice: (v: VoiceGender) => void;
  onName: (v: string) => void;
  onAge: (v: string) => void;
  onGender: (v: string) => void;
}) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>Your Profile</Text>
      <Text style={stepStyles.sub}>Set up your coaching experience.</Text>

      <Text style={stepStyles.sectionLabel}>YOUR NAME (optional)</Text>
      <TextInput
        style={stepStyles.input}
        value={name}
        onChangeText={onName}
        placeholder="Enter your name…"
        placeholderTextColor={Colors.textMuted}
        returnKeyType="next"
        autoCapitalize="words"
        maxLength={32}
      />

      <Text style={[stepStyles.sectionLabel, { marginTop: Spacing.lg }]}>AGE (optional)</Text>
      <TextInput
        style={stepStyles.input}
        value={age}
        onChangeText={(t) => {
          const digits = t.replace(/[^0-9]/g, '');
          const num = Number(digits);
          if (digits === '' || (num >= 1 && num <= 120)) onAge(digits);
        }}
        placeholder="Your age…"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={3}
      />

      <Text style={[stepStyles.sectionLabel, { marginTop: Spacing.lg }]}>GENDER</Text>
      <PillSelector
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={onGender}
      />

      <Text style={[stepStyles.sectionLabel, { marginTop: Spacing.lg }]}>DOMINANT HAND</Text>
      <PillSelector
        options={HAND_OPTIONS}
        selected={hand}
        onSelect={(v) => onHand(v as DominantHand)}
      />
      <Text style={stepStyles.hint}>
        The court mirrors left↔right for left-handed players.
      </Text>

      <Text style={[stepStyles.sectionLabel, { marginTop: Spacing.lg }]}>COACHING VOICE</Text>
      <PillSelector
        options={VOICE_OPTIONS}
        selected={voice}
        onSelect={(v) => onVoice(v as VoiceGender)}
      />
      <TouchableOpacity
        style={stepStyles.previewBtn}
        onPress={async () => { await Audio.initAudioSession(); Audio.speakText('Front Left. Recover to T.', 0.9, language, voice); }}
        activeOpacity={0.75}
      >
        <Ionicons name="volume-high-outline" size={15} color={Colors.brand} />
        <Text style={stepStyles.previewBtnText}>Preview Voice</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step 3: Language ─────────────────────────────────────────────────────────

function Step3({
  language, voice,
  onLanguage,
}: {
  language: Language;
  voice: VoiceGender;
  onLanguage: (v: Language) => void;
}) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.title}>Coaching Language</Text>
      <Text style={stepStyles.sub}>Pick the language for position calls.</Text>

      <View style={langStyles.grid}>
        {LANGUAGE_OPTIONS.map((opt) => {
          const active = opt.value === language;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[langStyles.chip, active && langStyles.chipActive]}
              onPress={() => onLanguage(opt.value)}
              activeOpacity={0.75}
            >
              <Text style={[langStyles.chipLabel, active && langStyles.chipLabelActive]}>
                {opt.label}
              </Text>
              {active && <Ionicons name="checkmark" size={13} color={Colors.brand} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={langStyles.previewBtn}
        onPress={async () => { await Audio.initAudioSession(); Audio.speakText('Front Left. Recover to T.', 0.9, language, voice); }}
        activeOpacity={0.75}
      >
        <Ionicons name="volume-high-outline" size={16} color={Colors.brand} />
        <Text style={langStyles.previewText}>Preview Voice</Text>
      </TouchableOpacity>
      <Text style={langStyles.previewHint}>
        Plays: "Front Left. Recover to T." in {getLanguageLabel(language)}
      </Text>
    </View>
  );
}

const langStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive:       { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  chipLabel:        { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textMuted },
  chipLabelActive:  { color: Colors.brand, fontWeight: FontWeight.semiBold },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    height: ButtonHeight.md, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft, marginBottom: Spacing.sm,
  },
  previewText:  { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.brand },
  previewHint:  { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: 'center' },
});

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const { isOnboardingComplete, hasCompletedAuth, profile, setProfile, completeOnboarding } = useProfileStore();

  const [step,     setStep]     = useState(0);
  const [skill,    setSkill]    = useState<SkillLevel>(profile.skillLevel);
  const [goal,     setGoal]     = useState<TrainingGoal>(profile.trainingGoal);
  const [hand,     setHand]     = useState<DominantHand>(profile.dominantHand);
  const [voice,    setVoice]    = useState<VoiceGender>(profile.voiceGender);
  const [name,     setName]     = useState(profile.name);
  const [age,      setAge]      = useState(profile.age ? String(profile.age) : '');
  const [gender,   setGender]   = useState(profile.gender ?? '');
  const [language, setLanguage] = useState<Language>(profile.language ?? 'en-US');

  function handleGender(v: string) {
    setGender(v);
    setVoice(v as VoiceGender);
  }

  function handleNext() {
    if (step < 2) { setStep(step + 1); }
    else { finish(); }
  }

  function finish() {
    // BUG-022: fall back to 'Player' if name was left blank so profile.name is never empty.
    const finalName = name.trim() || 'Player';
    setProfile({
      skillLevel: skill, trainingGoal: goal, dominantHand: hand,
      voiceGender: voice, name: finalName,
      age: age ? Number(age) : null,
      gender: gender || null,
      language,
    });
    completeOnboarding();
  }

  return (
    <Modal
      visible={hasCompletedAuth && !isOnboardingComplete}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ProgressDots total={3} current={step} />

            {step === 0 && (
              <Step1
                skill={skill} goal={goal}
                onSkill={setSkill} onGoal={setGoal}
              />
            )}
            {step === 1 && (
              <Step2
                hand={hand} voice={voice} name={name} age={age} gender={gender} language={language}
                onHand={setHand} onVoice={setVoice} onName={setName}
                onAge={setAge} onGender={handleGender}
              />
            )}
            {step === 2 && (
              <Step3
                language={language} voice={voice}
                onLanguage={setLanguage}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 && (
              <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextText}>
                {step < 2 ? 'Next  →' : '▶  Start Training'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const stepStyles = StyleSheet.create({
  container:      { flex: 1 },
  title:          { fontSize: FontSize.hero, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  tagline:        { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, letterSpacing: 0.2, marginBottom: Spacing.sm },
  taglineGreen:   { color: '#34C759', fontWeight: FontWeight.bold },
  taglineOrange:  { color: Colors.brand, fontWeight: FontWeight.bold },
  sub:            { fontSize: FontSize.body, color: Colors.textMuted, marginBottom: Spacing.xl },
  explainerCard:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: `${Colors.brand}12`, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: `${Colors.brand}30`,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  explainerText:  { flex: 1, fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 18 },
  sectionLabel:   {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1.2, marginBottom: Spacing.sm,
  },
  pillWrap:       { gap: Spacing.sm, marginBottom: Spacing.xl },
  skillPill: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md,
  },
  skillPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  skillLabel:      { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  skillLabelActive:{ color: Colors.primary },
  skillDesc:       { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  skillDescActive: { color: Colors.primaryDim },
  hint:            { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 18 },
  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    height: ButtonHeight.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
    marginTop: Spacing.sm,
  },
  previewBtnText: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.brand },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  goalCard: {
    width: GOAL_CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  goalCardActive: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandSoft,
  },
  goalLabel: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  goalLabelActive: { color: Colors.brand },
  goalDesc: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  goalDescActive: { color: `${Colors.brand}B0` } as any,
});

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  footer: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  backBtn: {
    height: ButtonHeight.lg, paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backText:  { fontSize: FontSize.body, color: Colors.textSecondary, fontWeight: FontWeight.semiBold },
  nextBtn: {
    flex: 1, height: ButtonHeight.lg, backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
  },
  nextText:  { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
