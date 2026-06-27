import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Modal, Image, Linking,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';
import PillSelector from '../components/ui/PillSelector';
import { useProfileStore } from '../stores/profileStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useProgressStore } from '../stores/progressStore';
import { useBadgesStore } from '../stores/badgesStore';
import { getLanguageLabel } from '../constants/languages';
import { getIntervalMs, MOVES_PER_SET, MOVEMENT_PHASE_MS, PACE_STEPS_MS } from '../constants/timing';
import { Language } from '../types';
import * as Audio from '../engine/audioEngine';
import ProfileScreen from './ProfileScreen';
import HelpModal from './HelpModal';
import TermsConsentModal from './TermsConsentModal';
import { useSignOut } from '../hooks/useSignOut';
import { useSessionStore } from '../stores/sessionStore';

// ─── Row components ───────────────────────────────────────────────────────────

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={grpStyles.wrap}>{children}</View>;
}

function CollapsibleGroup({
  icon, iconBg, iconColor, label, sub, children,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; sub?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={grpStyles.wrap}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.7}
        style={[rowStyles.row, !open && rowStyles.rowLast]}
      >
        <View style={[rowStyles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <View style={rowStyles.text}>
          <Text style={rowStyles.label}>{label}</Text>
          {sub && <Text style={rowStyles.sub}>{sub}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {open && children}
    </View>
  );
}

const grpStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
});

function SettingsRow({
  icon, iconBg, iconColor, label, sub, right, bottom, onPress, isLast,
}: {
  icon: string; iconBg: string; iconColor: string;
  label: string; sub?: string;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const topContent = (
    <>
      <View style={[rowStyles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        {sub && <Text style={rowStyles.sub}>{sub}</Text>}
      </View>
      {right && <View style={rowStyles.right}>{right}</View>}
    </>
  );

  const Inner = bottom ? (
    <View style={[rowStyles.row, rowStyles.rowStacked, isLast && rowStyles.rowLast]}>
      <View style={rowStyles.rowTop}>{topContent}</View>
      <View style={rowStyles.bottom}>{bottom}</View>
    </View>
  ) : (
    <View style={[rowStyles.row, isLast && rowStyles.rowLast]}>
      {topContent}
    </View>
  );
  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{Inner}</TouchableOpacity>;
  }
  return Inner;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLast:    { borderBottomWidth: 0 },
  rowStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 0 },
  rowTop:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text:       { flex: 1 },
  label:      { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  sub:        { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  right:      { alignItems: 'flex-end', maxWidth: '56%' },
  bottom:     { paddingTop: Spacing.sm, paddingLeft: 36 + Spacing.md },
});

// ─── Skill colour map ─────────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
  beginner:     Colors.levelBeginner,
  intermediate: Colors.levelIntermediate,
  advanced:     Colors.levelAdvanced,
  elite:        Colors.levelElite,
  pro:          Colors.levelPro,
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const TEST_PHRASES: Partial<Record<Language, string>> = {
  'en-US': 'Front left. Back right. Recover to T.',
  'en-GB': 'Front left. Back right. Recover to T.',
  es: 'Esquina delantera izquierda. Vuelve a la T.',
  fr: 'Avant gauche. Récupère le T.',
  de: 'Vorne links. Zurück zur T-Position.',
  it: 'Angolo anteriore sinistro. Torna alla T.',
  pt: 'Frente esquerda. Volte para o T.',
  nl: 'Voor links. Terug naar de T.',
  hi: 'आगे बाईं तरफ। टी पर वापस जाएं।',
  ar: 'الأمام الأيسر. العودة إلى مركز الملعب.',
  zh: '前左角。回到T位。',
  ja: 'フロントレフト。Tポジションに戻れ。',
  ko: '앞 왼쪽. T자리로 돌아가세요.',
};

export default function SettingsScreen() {
  const db = useSQLiteContext() as any;
  const { profile, resetProfile, deleteAccount } = useProfileStore();
  const settings       = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings  = useSettingsStore((s) => s.resetSettings);
  const { clearCache } = useProgressStore();
  const performSignOut = useSignOut();

  const [profileVisible, setProfileVisible] = useState(false);
  const [helpVisible, setHelpVisible]       = useState(false);
  const [termsVisible, setTermsVisible]     = useState(false);

  const displayName = profile.name.trim() || 'Player';
  const skillColor  = SKILL_COLORS[profile.skillLevel] ?? Colors.levelIntermediate;

  const paceOffset  = PACE_STEPS_MS[settings.defaultPaceStep ?? 3] ?? 0;
  const rawInterval = getIntervalMs(settings.defaultDifficulty, settings.defaultTempo) + paceOffset;
  const movPhase    = MOVEMENT_PHASE_MS[settings.defaultDifficulty][settings.defaultTempo];
  const interval    = Math.max(movPhase + 400, rawInterval);
  const movesPerSet = MOVES_PER_SET[settings.defaultDifficulty];
  const repsPerMin  = Math.round(60_000 / interval);
  const langLabel   = getLanguageLabel(profile.language);

  async function testVoice() {
    await Audio.initAudioSession();
    const phrase = TEST_PHRASES[profile.language] ?? 'Front left. Back right. Recover to T.';
    Audio.speakText(phrase, settings.speechRate, profile.language, profile.voiceGender);
  }

  function handleResetProgress() {
    Alert.alert('Reset Progress History', 'This will delete all session history and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          try {
            // Children (movements, personal_bests) reference sessions via FK; delete them first.
            await db.execAsync(
              'DELETE FROM movements; DELETE FROM personal_bests; DELETE FROM checkpoints; DELETE FROM sessions;'
            );
          } catch (e) {
            console.warn('[Settings] SQLite reset failed:', e);
          }
          clearCache();
          useBadgesStore.getState().resetBadges();
          // BUG-014: trigger screens watching lastSessionCompletedAt to reload.
          useProgressStore.getState().markSessionCompleted();
        },
      },
    ]);
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => performSignOut() },
      ],
    );
  }

  function handleResetAll() {
    Alert.alert('Reset All Settings', 'This resets your profile and all app settings to defaults. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          useSessionStore.getState().endSession();
          try {
            await db.execAsync(
              'DELETE FROM movements; DELETE FROM personal_bests; DELETE FROM checkpoints; DELETE FROM sessions;'
            );
          } catch (e) {
            console.warn('[Settings] SQLite reset failed:', e);
          }
          resetProfile();
          resetSettings();
          clearCache();
          useBadgesStore.getState().resetBadges();
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your training data, progress history, and account credentials from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              // Children (movements, personal_bests) reference sessions via FK; delete them first.
              await db.execAsync(
                'DELETE FROM movements; DELETE FROM personal_bests; DELETE FROM checkpoints; DELETE FROM sessions;'
              );
            } catch {}
            await SecureStore.deleteItemAsync('sgx-user-credentials').catch(() => {});
            await SecureStore.deleteItemAsync('sgx-auth-attempts').catch(() => {});
            clearCache();
            useBadgesStore.getState().resetBadges();
            resetSettings();
            // Defer auth state reset until the alert has fully dismissed so the
            // AuthModal animates in cleanly on all platforms (Android in particular
            // fires onPress before the native alert finishes animating out).
            InteractionManager.runAfterInteractions(() => {
              deleteAccount();
            });
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Profile modal ──────────────────────────────────── */}
      <Modal
        visible={profileVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setProfileVisible(false)}
      >
        <ProfileScreen onClose={() => setProfileVisible(false)} />
      </Modal>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      {termsVisible && <TermsConsentModal viewOnly onClose={() => setTermsVisible(false)} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HERO ──────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroAppRow}>
            <View style={styles.heroAppIcon}>
              <Ionicons name="body" size={18} color={Colors.brand} />
            </View>
            <Text style={styles.heroAppName}>
              {'Squash '}
              <Text style={styles.heroAppNameAccent}>GhostingX</Text>
            </Text>
          </View>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Settings</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={15} color={Colors.danger} />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PROFILE CARD ──────────────────────────────────── */}
        <TouchableOpacity style={styles.profileCard} onPress={() => setProfileVisible(true)} activeOpacity={0.85}>
          <View style={[styles.profileAvatar, { borderColor: skillColor }]}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.profileAvatarImg} />
            ) : (
              <Text style={[styles.profileInitial, { color: skillColor }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{displayName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
              <View style={[styles.skillChip, { backgroundColor: `${skillColor}22`, borderColor: `${skillColor}45` }]}>
                <Text style={[styles.skillChipText, { color: skillColor }]}>
                  {profile.skillLevel.charAt(0).toUpperCase() + profile.skillLevel.slice(1)}
                </Text>
              </View>
              <Text style={styles.accountTypeLabel}>
                {profile.isGuest ? 'Guest Account' : 'Registered'}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={styles.editProfileLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── AUDIO ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>AUDIO</Text>
        <SettingsGroup>
          <SettingsRow
            icon="mic" iconBg={`${Colors.accentLibrary}22`} iconColor={Colors.accentLibrary}
            label="Voice Instructions" sub="Position calls and recovery cues"
            right={
              <Switch
                value={settings.voiceEnabled}
                onValueChange={(v) => updateSettings({ voiceEnabled: v })}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.brand }}
                thumbColor={Colors.textPrimary}
              />
            }
          />
          <SettingsRow
            icon="speedometer" iconBg={`${Colors.accentRoutines}22`} iconColor={Colors.accentRoutines}
            label="Speech Rate"
            sub="0.7–0.9× for Bluetooth · 1.1–1.6× for court speaker or Elite/Pro pace"
            right={
              <View style={srStyles.stepper}>
                <TouchableOpacity
                  style={srStyles.stepBtn}
                  onPress={() => {
                    const next = Math.max(0.7, Math.round((settings.speechRate - 0.1) * 10) / 10);
                    updateSettings({ speechRate: next });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={srStyles.stepVal}>{Math.round(settings.speechRate * 10) / 10}×</Text>
                <TouchableOpacity
                  style={srStyles.stepBtn}
                  onPress={() => {
                    const next = Math.min(1.6, Math.round((settings.speechRate + 0.1) * 10) / 10);
                    updateSettings({ speechRate: next });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            }
          />
          <SettingsRow
            icon="chatbubbles" iconBg={Colors.brandMuted} iconColor={Colors.brand}
            label="Coaching Cues" sub="Mid-session encouragement"
            right={
              <Switch
                value={settings.coachingCues}
                onValueChange={(v) => updateSettings({ coachingCues: v })}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.brand }}
                thumbColor={Colors.textPrimary}
              />
            }
          />
          <SettingsRow
            icon="pulse" iconBg={Colors.brandMuted} iconColor={Colors.brand}
            label="Haptic Feedback" sub="Vibration on court calls"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.brand }}
                thumbColor={Colors.textPrimary}
              />
            }
          />
          <SettingsRow
            icon="play-circle" iconBg={`${Colors.gold}22`} iconColor={Colors.gold}
            label="Test Voice"
            sub={`${langLabel} · ${profile.voiceGender === 'female' ? 'Female' : 'Male'} · raise system volume for Bluetooth/court use`}
            right={<Ionicons name="volume-high" size={18} color={Colors.gold} />}
            onPress={testVoice}
            isLast
          />
        </SettingsGroup>

        {/* ── DEFAULT SESSION ───────────────────────────────── */}
        <Text style={styles.sectionLabel}>DEFAULT SESSION</Text>
        <SettingsGroup>
          <SettingsRow
            icon="grid" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
            label="Court System"
            right={
              <PillSelector
                options={[{ label: '6-Point', value: '6pt' }, { label: '10-Point', value: '10pt' }]}
                selected={settings.defaultCourtSystem}
                onSelect={(v) => updateSettings({ defaultCourtSystem: v as any })}
                size="sm"
              />
            }
          />
          <SettingsRow
            icon="tennisball" iconBg={`${Colors.brand}22`} iconColor={Colors.brand}
            label="Court Style"
            sub={settings.courtMode === 'wooden' ? 'Wooden Court — warm wood floor + red lines' : 'Glass Court — dark premium stadium theme'}
            right={
              <PillSelector
                options={[{ label: 'Wooden', value: 'wooden' }, { label: 'Glass', value: 'glass' }]}
                selected={settings.courtMode ?? 'wooden'}
                onSelect={(v) => updateSettings({ courtMode: v as 'glass' | 'wooden' })}
                size="sm"
              />
            }
          />
          <SettingsRow
            icon="trophy" iconBg={`${Colors.gold}22`} iconColor={Colors.gold}
            label="Difficulty"
            right={
              <PillSelector
                options={[
                  { label: 'Beg.',   value: 'beginner'     },
                  { label: 'Inter.', value: 'intermediate' },
                  { label: 'Adv.',   value: 'advanced'     },
                  { label: 'Elite',  value: 'elite'        },
                  { label: 'Pro',    value: 'pro'          },
                ]}
                selected={settings.defaultDifficulty}
                onSelect={(v) => updateSettings({ defaultDifficulty: v as any })}
                size="sm"
                scrollable
              />
            }
          />
          <SettingsRow
            icon="flash" iconBg={Colors.brandMuted} iconColor={Colors.brand}
            label="Tempo"
            right={
              <PillSelector
                options={[
                  { label: 'Slow',      value: 'slow'      },
                  { label: 'Natural',   value: 'natural'   },
                  { label: 'Explosive', value: 'explosive' },
                ]}
                selected={settings.defaultTempo}
                onSelect={(v) => updateSettings({ defaultTempo: v as any })}
                size="sm"
              />
            }
          />
          <SettingsRow
            icon="hourglass-outline" iconBg={`${Colors.rest}22`} iconColor={Colors.rest}
            label="Default Pace"
            sub="Starting pace every session — adjust live with ± during training"
            bottom={
              <PillSelector
                options={[
                  { label: 'Turbo',    value: '6' },
                  { label: 'Fast+',    value: '5' },
                  { label: 'Fast',     value: '4' },
                  { label: 'Normal',   value: '3' },
                  { label: 'Easy',     value: '2' },
                  { label: 'Slow',     value: '1' },
                  { label: 'Recovery', value: '0' },
                ]}
                selected={String(settings.defaultPaceStep ?? 3)}
                onSelect={(v) => updateSettings({ defaultPaceStep: Number(v) })}
                size="sm"
                wrap
              />
            }
          />
          <SettingsRow
            icon="eye" iconBg={`${Colors.accentLibrary}22`} iconColor={Colors.accentLibrary}
            label="Default Voice Mode"
            sub="How position calls are delivered"
            bottom={
              <PillSelector
                options={[
                  { label: 'Voice+Visual', value: 'voice+visual' },
                  { label: 'Voice Only',   value: 'voice-only'   },
                  { label: 'Visual Only',  value: 'visual-only'  },
                  { label: 'Beep',         value: 'beep'         },
                ]}
                selected={settings.defaultVoiceMode}
                onSelect={(v) => updateSettings({ defaultVoiceMode: v as any })}
                size="sm"
                wrap
              />
            }
          />
          <SettingsRow
            icon="sunny" iconBg={`${Colors.warning}22`} iconColor={Colors.warning}
            label="Keep Screen Awake" sub="Prevents display sleep during sessions"
            right={
              <Switch
                value={settings.keepScreenAwake}
                onValueChange={(v) => updateSettings({ keepScreenAwake: v })}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.brand }}
                thumbColor={Colors.textPrimary}
              />
            }
            isLast
          />
        </SettingsGroup>

        {/* ── DISPLAY ───────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DISPLAY</Text>
        <SettingsGroup>
          <SettingsRow
            icon="eye-off" iconBg={`${Colors.accentSettings}22`} iconColor={Colors.accentSettings}
            label="Reduced Motion" sub="Simpler court animations (accessibility)"
            right={
              <Switch
                value={settings.reducedMotion}
                onValueChange={(v) => updateSettings({ reducedMotion: v })}
                trackColor={{ false: Colors.surfaceElevated, true: Colors.brand }}
                thumbColor={Colors.textPrimary}
              />
            }
            isLast
          />
        </SettingsGroup>

        {/* ── SESSION PREVIEW ───────────────────────────────── */}
        <View style={styles.timingCard}>
          <Text style={styles.timingLabel}>SESSION PREVIEW</Text>
          <View style={styles.timingRow}>
            {[
              { val: `${(interval / 1000).toFixed(1)}s`, lbl: 'interval'  },
              { val: String(repsPerMin),                 lbl: 'reps/min'  },
              { val: String(movesPerSet),                lbl: 'moves/set' },
              { val: `${settings.defaultDuration}'`,    lbl: 'duration'  },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={styles.timingStat}>
                <Text style={styles.timingVal}>{val}</Text>
                <Text style={styles.timingStatLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── ACCOUNT ───────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <SettingsGroup>
          <SettingsRow
            icon="log-out"
            iconBg={`${Colors.danger}22`}
            iconColor={Colors.danger}
            label="Sign Out"
            sub="You'll need to sign in again on next launch"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="trash-bin"
            iconBg={`${Colors.danger}22`}
            iconColor={Colors.danger}
            label="Delete Account"
            sub="Permanently removes all data and credentials"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={handleDeleteAccount}
            isLast
          />
        </SettingsGroup>

        {/* ── HELP & GUIDE ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>HELP & GUIDE</Text>
        <SettingsGroup>
          {/* BUG-024: removed duplicate FAQ row — both pointed to the same modal */}
          <SettingsRow
            icon="book-outline"
            iconBg={Colors.brandMuted}
            iconColor={Colors.brand}
            label="Help & FAQ"
            sub="Court systems, positions, drills and troubleshooting"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={() => setHelpVisible(true)}
            isLast
          />
        </SettingsGroup>

        {/* ── LEGAL ─────────────────────────────────────────── */}
        <CollapsibleGroup
          icon="shield-outline" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
          label="Legal" sub="Privacy, Terms & Conditions, Contact"
        >
          <SettingsRow
            icon="shield-checkmark" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
            label="Privacy Policy"
            sub="All data stored locally — nothing leaves your device"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={() => setTermsVisible(true)}
          />
          <SettingsRow
            icon="document-text" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
            label="Terms & Conditions"
            sub="Liability, assumption of risk, and usage terms"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={() => setTermsVisible(true)}
          />
          <SettingsRow
            icon="mail" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
            label="Contact Support" sub="squash.ghostingx@gmail.com"
            right={<Ionicons name="open-outline" size={16} color={Colors.textMuted} />}
            onPress={() => Linking.openURL('mailto:squash.ghostingx@gmail.com')}
            isLast
          />
        </CollapsibleGroup>

        {/* ── APP ───────────────────────────────────────────── */}
        <CollapsibleGroup
          icon="settings-outline" iconBg={`${Colors.warning}22`} iconColor={Colors.warning}
          label="App" sub="About, reset options"
        >
          <SettingsRow
            icon="information-circle" iconBg={`${Colors.accentProgress}22`} iconColor={Colors.accentProgress}
            label="About" sub="Version 1.0.0 · All data stored locally on device"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={() => Alert.alert(
              'Squash GhostingX v1.0.0',
              'AI-guided squash ghosting coach with real-time voice coaching, analytics, and structured training programs.\n\nAll training data is stored exclusively on your device. No server. No cloud.',
              [{ text: 'Close', style: 'cancel' }]
            )}
          />
          <SettingsRow
            icon="trash" iconBg={`${Colors.danger}22`} iconColor={Colors.danger}
            label="Reset Progress History" sub="Deletes all session records"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={handleResetProgress}
          />
          <SettingsRow
            icon="refresh-circle" iconBg={`${Colors.warning}22`} iconColor={Colors.warning}
            label="Reset All Settings" sub="Restores defaults for profile and app"
            right={<Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
            onPress={handleResetAll}
            isLast
          />
        </CollapsibleGroup>

        <Text style={styles.footerText}>Squash GhostingX · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.heroSettings,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: Spacing.md,
  },

  profileCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  profileAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  profileInitial:   { fontSize: 20, fontWeight: FontWeight.bold },
  profileName:      { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  skillChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  skillChipText:    { fontSize: FontSize.micro, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  accountTypeLabel: { fontSize: FontSize.caption, color: Colors.textMuted },
  editProfileLabel: { fontSize: FontSize.caption, color: Colors.brand, fontWeight: FontWeight.semiBold },
  heroAppRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  heroAppIcon:      { width: 32, height: 32, borderRadius: 9, backgroundColor: Colors.brandMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.brand}30` },
  heroAppName:      { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 0.1 },
  heroAppNameAccent:{ color: Colors.brand },
  heroTitleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle:       { fontSize: 34, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -0.5 },
  signOutBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${Colors.danger}18`, borderWidth: 1, borderColor: `${Colors.danger}35`, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 7 },
  signOutBtnText:  { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.danger },

  sectionLabel: {
    fontSize: FontSize.caption, fontWeight: FontWeight.bold,
    color: Colors.textMuted, letterSpacing: 1.2,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },

  timingCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: `${Colors.accentProgress}0F`,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.accentProgress}33`,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timingLabel:    { fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.accentProgress, letterSpacing: 1.2, marginBottom: Spacing.md },
  timingRow:      { flexDirection: 'row', justifyContent: 'space-around' },
  timingStat:     { alignItems: 'center' },
  timingVal:      { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  timingStatLbl:  { fontSize: FontSize.micro, color: Colors.textMuted, marginTop: 2 },

  footerText: { fontSize: FontSize.caption, color: Colors.textMuted, textAlign: 'center', paddingBottom: Spacing.xl },
});

const srStyles = StyleSheet.create({
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  stepBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepVal: {
    fontSize: FontSize.body, fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary, minWidth: 36, textAlign: 'center',
  },
});
