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
import { SkillLevel, TrainingGoal, DominantHand, VoiceGender } from '../../types';

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
      <Text style={stepStyles.title}>Welcome to SquashGhostingX</Text>
      <Text style={stepStyles.sub}>Let's personalise your training.</Text>

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
  hand, voice, name, age, gender,
  onHand, onVoice, onName, onAge, onGender,
}: {
  hand: DominantHand; voice: VoiceGender; name: string; age: string; gender: string;
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
        onChangeText={onAge}
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
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const { isOnboardingComplete, hasCompletedAuth, profile, setProfile, completeOnboarding } = useProfileStore();

  const [step,   setStep]   = useState(0);
  const [skill,  setSkill]  = useState<SkillLevel>(profile.skillLevel);
  const [goal,   setGoal]   = useState<TrainingGoal>(profile.trainingGoal);
  const [hand,   setHand]   = useState<DominantHand>(profile.dominantHand);
  const [voice,  setVoice]  = useState<VoiceGender>(profile.voiceGender);
  const [name,   setName]   = useState(profile.name);
  const [age,    setAge]    = useState(profile.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile.gender ?? '');

  function handleGender(v: string) {
    setGender(v);
    if (v === 'male' || v === 'female') setVoice(v as VoiceGender);
  }

  function handleNext() {
    if (step < 1) { setStep(step + 1); }
    else { finish(); }
  }

  function finish() {
    setProfile({
      skillLevel: skill, trainingGoal: goal, dominantHand: hand,
      voiceGender: voice, name,
      age: age ? Number(age) : null,
      gender: gender || null,
    });
    completeOnboarding();
  }

  return (
    <Modal
      visible={hasCompletedAuth && !isOnboardingComplete}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ProgressDots total={2} current={step} />

            {step === 0 && (
              <Step1
                skill={skill} goal={goal}
                onSkill={setSkill} onGoal={setGoal}
              />
            )}
            {step === 1 && (
              <Step2
                hand={hand} voice={voice} name={name} age={age} gender={gender}
                onHand={setHand} onVoice={setVoice} onName={setName}
                onAge={setAge} onGender={handleGender}
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
                {step < 1 ? 'Next  →' : '▶  Start Training'}
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
  sub:            { fontSize: FontSize.body, color: Colors.textMuted, marginBottom: Spacing.xl },
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
