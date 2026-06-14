import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, FlatList, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';
import { LANGUAGE_OPTIONS, getLanguageLabel } from '../constants/languages';
import PillSelector from '../components/ui/PillSelector';
import { useProfileStore } from '../stores/profileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { SkillLevel, TrainingGoal, DominantHand, VoiceGender } from '../types';
import * as Audio from '../engine/audioEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(day: string, month: string, year: string): number | null {
  const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
  if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const birth = new Date(y, m - 1, d);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SKILL_COLORS: Record<SkillLevel, string> = {
  beginner:     Colors.levelBeginner,
  intermediate: Colors.levelIntermediate,
  advanced:     Colors.levelAdvanced,
  elite:        Colors.levelElite,
  pro:          Colors.levelPro,
};

const SKILL_OPTIONS = [
  { label: 'Beginner',     value: 'beginner'     },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced',     value: 'advanced'     },
  { label: 'Elite',        value: 'elite'        },
  { label: 'Pro',          value: 'pro'          },
];

const GOAL_OPTIONS = [
  { label: 'Fitness',    value: 'fitness'    },
  { label: 'Footwork',   value: 'footwork'   },
  { label: 'Match Prep', value: 'match-prep' },
  { label: 'Speed',      value: 'speed'      },
  { label: 'Agility',    value: 'agility'    },
];

// ─── Small shared components ──────────────────────────────────────────────────

function SLabel({ label }: { label: string }) {
  return <Text style={sStyles.sectionLabel}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={sStyles.card}>{children}</View>;
}

function Div() {
  return <View style={sStyles.divider} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen({ onClose }: { onClose?: () => void } = {}) {
  const { profile, setProfile, signOut } = useProfileStore();
  const settings = useSettingsStore((s) => s.settings);

  const [langVisible, setLangVisible] = useState(false);
  const [localName,   setLocalName]   = useState(profile.name);
  const [dobDay,      setDobDay]      = useState('');
  const [dobMonth,    setDobMonth]    = useState('');
  const [dobYear,     setDobYear]     = useState('');

  const displayName = profile.name.trim() || 'Player';
  const skillColor  = SKILL_COLORS[profile.skillLevel] ?? Colors.primary;
  const langLabel   = getLanguageLabel(profile.language);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Allow access to your photo library to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setProfile({ photoUri: result.assets[0].uri });
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      "Your training data and settings stay on this device. You'll need to sign in again on next launch.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            onClose?.();  // close the modal before signing out so AuthModal can show
            signOut();
          },
        },
      ]
    );
  }

  // When shown as a modal there is no tab bar — protect the bottom safe area too
  const safeEdges = onClose
    ? (['top', 'bottom'] as const)
    : (['top'] as const);

  const content = (
    <SafeAreaView style={styles.safe} edges={safeEdges}>

      {/* ── Language picker modal ───────────────────────────────────────── */}
      <Modal
        visible={langVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setLangVisible(false)}
      >
        <SafeAreaProvider>
        <SafeAreaView style={langStyles.safe} edges={['top', 'bottom']}>
          <View style={langStyles.header}>
            <Text style={langStyles.title}>Language</Text>
            <TouchableOpacity onPress={() => setLangVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={LANGUAGE_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[langStyles.row, item.value === profile.language && langStyles.rowActive]}
                onPress={async () => {
                  setProfile({ language: item.value });
                  setLangVisible(false);
                  await Audio.initAudioSession();
                  Audio.speakText('Front Left. Recover to T.', settings.speechRate, item.value, profile.voiceGender);
                }}
                activeOpacity={0.75}
              >
                <Text style={[langStyles.rowText, item.value === profile.language && langStyles.rowTextActive]}>
                  {item.label}
                </Text>
                {item.value === profile.language && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.brand} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: Spacing.base }} />
            )}
          />
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      {/* ── Modal header bar (only when opened as modal, not as tab screen) ─ */}
      {onClose && (
        <View style={styles.modalBar}>
          <View style={styles.modalBarSide} />
          <Text style={styles.modalBarTitle}>Your Profile</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalBarSide}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── HERO ───────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap} activeOpacity={0.85}>
              <View style={[styles.avatar, { borderColor: skillColor }]}>
                {profile.photoUri ? (
                  <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarInitial, { color: skillColor }]}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.cameraChip}>
                <Ionicons name="camera" size={13} color={Colors.textPrimary} />
              </View>
            </TouchableOpacity>

            <Text style={styles.heroName}>{displayName}</Text>

            <View style={[styles.skillBadge, { backgroundColor: `${skillColor}22`, borderColor: `${skillColor}44` }]}>
              <Text style={[styles.skillBadgeText, { color: skillColor }]}>
                {profile.skillLevel.charAt(0).toUpperCase() + profile.skillLevel.slice(1)}
              </Text>
            </View>

            <Text style={styles.heroSub}>
              {profile.isGuest ? 'Guest · data stored locally' : 'Registered Account'}
            </Text>
          </View>

          {/* ── PERSONAL ───────────────────────────────────────────── */}
          <SLabel label="PERSONAL" />
          <Card>
            <View style={sStyles.row}>
              <View style={sStyles.iconBox}>
                <Ionicons name="person-outline" size={17} color={Colors.textMuted} />
              </View>
              <Text style={sStyles.fieldLabel}>Name</Text>
              <TextInput
                style={sStyles.textInput}
                value={localName}
                onChangeText={setLocalName}
                onBlur={() => setProfile({ name: localName.trim() })}
                placeholder="Add name"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
                autoCapitalize="words"
                maxLength={32}
              />
            </View>
            <Div />
            <View style={sStyles.row}>
              <View style={sStyles.iconBox}>
                <Ionicons name="calendar-outline" size={17} color={Colors.textMuted} />
              </View>
              <Text style={sStyles.fieldLabel}>Date of Birth</Text>
              <View style={sStyles.dobInputs}>
                <TextInput
                  style={sStyles.dobSegment}
                  value={dobDay}
                  onChangeText={(t) => { setDobDay(t); const a = calcAge(t, dobMonth, dobYear); if (a !== null) setProfile({ age: a }); }}
                  placeholder="DD"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={sStyles.dobSep}>/</Text>
                <TextInput
                  style={sStyles.dobSegment}
                  value={dobMonth}
                  onChangeText={(t) => { setDobMonth(t); const a = calcAge(dobDay, t, dobYear); if (a !== null) setProfile({ age: a }); }}
                  placeholder="MM"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={sStyles.dobSep}>/</Text>
                <TextInput
                  style={[sStyles.dobSegment, sStyles.dobSegmentYear]}
                  value={dobYear}
                  onChangeText={(t) => { setDobYear(t); const a = calcAge(dobDay, dobMonth, t); if (a !== null) setProfile({ age: a }); }}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                {calcAge(dobDay, dobMonth, dobYear) !== null && (
                  <Text style={sStyles.ageCalc}>{calcAge(dobDay, dobMonth, dobYear)} yrs</Text>
                )}
              </View>
            </View>
            <Div />
            <View style={[sStyles.row, sStyles.rowLast]}>
              <View style={sStyles.iconBox}>
                <Ionicons name="person-circle-outline" size={17} color={Colors.textMuted} />
              </View>
              <Text style={sStyles.fieldLabel}>Gender</Text>
              <PillSelector
                options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]}
                selected={profile.gender ?? 'male'}
                onSelect={(v) => setProfile({ gender: v })}
                size="sm"
              />
            </View>
          </Card>

          {/* ── TRAINING ───────────────────────────────────────────── */}
          <SLabel label="TRAINING" />
          <Card>
            <View style={sStyles.blockRow}>
              <View style={sStyles.blockHeader}>
                <View style={[sStyles.iconBox, { backgroundColor: `${Colors.primary}18` }]}>
                  <Ionicons name="trending-up-outline" size={17} color={Colors.primary} />
                </View>
                <Text style={sStyles.fieldLabel}>Skill Level</Text>
              </View>
              <PillSelector
                options={SKILL_OPTIONS}
                selected={profile.skillLevel}
                onSelect={(v) => setProfile({ skillLevel: v as SkillLevel })}
                scrollable
              />
            </View>
            <Div />
            <View style={sStyles.blockRow}>
              <View style={sStyles.blockHeader}>
                <View style={[sStyles.iconBox, { backgroundColor: `${Colors.brand}18` }]}>
                  <Ionicons name="flag-outline" size={17} color={Colors.brand} />
                </View>
                <Text style={sStyles.fieldLabel}>Training Goal</Text>
              </View>
              <PillSelector
                options={GOAL_OPTIONS}
                selected={profile.trainingGoal}
                onSelect={(v) => setProfile({ trainingGoal: v as TrainingGoal })}
                scrollable
              />
            </View>
            <Div />
            <View style={[sStyles.row, sStyles.rowLast]}>
              <View style={[sStyles.iconBox, { backgroundColor: `${Colors.accentProgress}18` }]}>
                <Ionicons name="hand-right-outline" size={17} color={Colors.accentProgress} />
              </View>
              <Text style={sStyles.fieldLabel}>Dominant Hand</Text>
              <PillSelector
                options={[{ label: 'Right', value: 'right' }, { label: 'Left', value: 'left' }]}
                selected={profile.dominantHand}
                onSelect={(v) => setProfile({ dominantHand: v as DominantHand })}
                size="sm"
              />
            </View>
          </Card>

          {/* ── COACHING ───────────────────────────────────────────── */}
          <SLabel label="COACHING" />
          <Card>
            <View style={sStyles.row}>
              <View style={[sStyles.iconBox, { backgroundColor: `${Colors.accentLibrary}18` }]}>
                <Ionicons name="mic-outline" size={17} color={Colors.accentLibrary} />
              </View>
              <Text style={sStyles.fieldLabel}>Voice</Text>
              <PillSelector
                options={[{ label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }]}
                selected={profile.voiceGender}
                onSelect={async (v) => {
                  const gender = v as VoiceGender;
                  setProfile({ voiceGender: gender });
                  await Audio.initAudioSession();
                  Audio.speakText('Front Left. Recover to T.', settings.speechRate, profile.language, gender);
                }}
                size="sm"
              />
            </View>
            <Div />
            <TouchableOpacity
              style={[sStyles.row, sStyles.rowLast]}
              onPress={() => setLangVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[sStyles.iconBox, { backgroundColor: `${Colors.accentProgress}18` }]}>
                <Ionicons name="globe-outline" size={17} color={Colors.accentProgress} />
              </View>
              <Text style={sStyles.fieldLabel}>Language</Text>
              <View style={sStyles.valueRow}>
                <Text style={sStyles.valueText}>{langLabel}</Text>
                <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* ── ACCOUNT ───────────────────────────────────────────── */}
          <SLabel label="ACCOUNT" />
          <Card>
            <TouchableOpacity style={[sStyles.row, sStyles.rowLast]} onPress={handleSignOut} activeOpacity={0.7}>
              <View style={[sStyles.iconBox, { backgroundColor: `${Colors.danger}18` }]}>
                <Ionicons name="log-out-outline" size={17} color={Colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sStyles.fieldLabel, { color: Colors.danger }]}>Sign Out</Text>
                <Text style={sStyles.sub}>You'll be asked to sign in again on next launch</Text>
              </View>
            </TouchableOpacity>
          </Card>

          <Text style={styles.footer}>SquashGhostingX · v1.0.0</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  return onClose ? <SafeAreaProvider>{content}</SafeAreaProvider> : content;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  // Modal header bar — rendered outside ScrollView so it never scrolls away
  modalBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, height: 52,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalBarSide:  { width: 60, alignItems: 'flex-end' },
  modalBarTitle: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  modalDoneText: { fontSize: FontSize.label, color: Colors.brand, fontWeight: FontWeight.semiBold },

  hero: {
    backgroundColor: Colors.heroTrain,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: Spacing.lg,
  },

  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg:     { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontSize: 34, fontWeight: FontWeight.bold },
  cameraChip: {
    position: 'absolute', bottom: 0, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2, borderColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },

  heroName: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  skillBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  skillBadgeText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  footer: {
    fontSize: FontSize.caption, color: Colors.textMuted,
    textAlign: 'center', paddingVertical: Spacing.xl,
  },
});

const sStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1.2,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 + Spacing.base },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 13,
    gap: Spacing.md, minHeight: 52,
  },
  rowLast: {},

  blockRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md, paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.xs,
  },

  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  fieldLabel: {
    flex: 1,
    fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textPrimary,
  },
  sub: {
    fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2,
  },
  textInput: {
    fontSize: FontSize.label, color: Colors.textSecondary,
    textAlign: 'right', flexShrink: 1, minWidth: 80,
  },
  valueRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    flexShrink: 0,
  },
  valueText: {
    fontSize: FontSize.caption, color: Colors.textSecondary,
  },

  dobInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  dobSegment: {
    width: 36,
    height: 34,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: FontSize.label,
    color: Colors.textPrimary,
  },
  dobSegmentYear: { width: 52 },
  dobSep: {
    fontSize: FontSize.label,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  ageCalc: {
    fontSize: FontSize.caption,
    color: Colors.brand,
    fontWeight: FontWeight.semiBold,
    marginLeft: Spacing.xs,
  },
});

const langStyles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:         { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md + 2 },
  rowActive:     { backgroundColor: Colors.brandSoft },
  rowText:       { fontSize: FontSize.body, color: Colors.textSecondary },
  rowTextActive: { color: Colors.brand, fontWeight: FontWeight.semiBold },
});
