import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';
import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';
import { useSessionStore } from '../stores/sessionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useProgressLoader } from '../hooks/useProgressLoader';
import { getSuggestedDrill } from '../data/builtinPrograms';
import { SessionConfig } from '../types';
import ProfileScreen from './ProfileScreen';

type PopularBase = Omit<SessionConfig, 'dominantHand' | 'voiceGender' | 'language'>;

const HERO_HEADLINES = [
  'Ready to\nDominate the Court?',
  'Push Your\nLimits Today.',
  'Every Move\nMatters.',
  'Outwork.\nOutmove. Win.',
  'Champions Train\nEvery Day.',
  'Your Best Game\nStarts Here.',
  'No Limits.\nFull Court.',
  'Consistency\nBuilds Champions.',
] as const;

const POPULAR_DRILLS: {
  id: string; name: string; sub: string; minutes: number;
  color: string; icon: string; badge: string; base: PopularBase;
}[] = [
  {
    id: '6pt-blast', name: '6-Point Blast', sub: 'Movement · Random · Advanced',
    minutes: 15, color: '#FF9F0A', icon: 'body-outline', badge: '6PT',
    base: {
      drillType: 'movement', courtSystem: '6pt', coverage: 'full',
      patternType: 'random', tempo: 'explosive', difficulty: 'advanced',
      duration: 15, voiceMode: 'voice+visual', shotGroups: ['mixed'],
      restMode: 'auto', restSeconds: 15,
    },
  },
  {
    id: '10pt-blitz', name: '10-Point Blitz', sub: 'Movement · Random · Advanced',
    minutes: 20, color: '#0A84FF', icon: 'flash-outline', badge: '10PT',
    base: {
      drillType: 'movement', courtSystem: '10pt', coverage: 'full',
      patternType: 'random', tempo: 'explosive', difficulty: 'advanced',
      duration: 20, voiceMode: 'voice+visual', shotGroups: ['mixed'],
      restMode: 'auto', restSeconds: 15,
    },
  },
];


function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? 'P').toUpperCase();
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }: any) {
  const { profile, signOut } = useProfileStore();
  const { stats, lastSessionCompletedAt, recentSessions } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const { setPendingConfig, openDrillConfig } = useSessionStore();
  const { loadData } = useProgressLoader();
  const glowAnim       = useRef(new Animated.Value(0.5)).current;
  const headlineFade   = useRef(new Animated.Value(1)).current;
  const headlineLift   = useRef(new Animated.Value(0)).current;
  const headlineIdxRef = useRef(0);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);

  const name = profile.name.trim() || 'Player';

  // Pulse glow on START SESSION button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.0, duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Cycling hero headlines — fade out, swap text, fade + slide in
  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(headlineFade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        const next = (headlineIdxRef.current + 1) % HERO_HEADLINES.length;
        headlineIdxRef.current = next;
        setHeadlineIdx(next);
        headlineLift.setValue(14);
        Animated.parallel([
          Animated.timing(headlineFade, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.spring(headlineLift, { toValue: 0, useNativeDriver: true, tension: 130, friction: 10 }),
        ]).start();
      });
    }, 3800);
    return () => clearInterval(t);
  }, [headlineFade, headlineLift]);
  const lastSession = recentSessions[0] ?? null;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekSessions = recentSessions.filter(
    (s) => new Date(s.startedAt).getTime() >= oneWeekAgo,
  );
  const weekSessions  = thisWeekSessions.length;
  const weekMovements = thisWeekSessions.reduce((sum, s) => sum + s.movementsTotal, 0);
  const weekMinutes   = thisWeekSessions.reduce(
    (sum, s) => sum + Math.round(s.durationSeconds / 60), 0,
  );

  const suggestion = getSuggestedDrill(
    stats.zoneDistribution,
    stats.totalSessions,
    lastSession?.drillType ?? null,
    profile.skillLevel,
  );

  useEffect(() => { loadData(); }, [lastSessionCompletedAt]);

  function handleStartPopular(base: PopularBase) {
    setPendingConfig({
      ...base,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
    });
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      "Your training data stays on this device. You'll need to sign in again on next launch.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  }

  function handleStartGhosting() {
    setPendingConfig({
      ...suggestion.program.config,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
      tempo:        settings.defaultTempo,
      difficulty:   settings.defaultDifficulty,
      courtSystem:  settings.defaultCourtSystem,
    });
  }

  function handleQuickLastSession() {
    if (!lastSession) { openDrillConfig(); return; }
    setPendingConfig({
      drillType:    lastSession.drillType,
      courtSystem:  lastSession.courtSystem,
      difficulty:   lastSession.difficulty,
      tempo:        settings.defaultTempo,
      coverage:     'full',
      patternType:  'random',
      shotGroups:   ['mixed'],
      duration:     settings.defaultDuration,
      restMode:     'auto',
      restSeconds:  15,
      voiceMode:    settings.defaultVoiceMode,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
    });
  }

  return (
    <>
      <Modal visible={profileVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setProfileVisible(false)}>
        <ProfileScreen onClose={() => setProfileVisible(false)} />
      </Modal>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Top row */}
          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.heroIdentity} onPress={() => setProfileVisible(true)} activeOpacity={0.8}>
              <View style={styles.avatarWrap}>
                {profile.photoUri ? (
                  <Image source={{ uri: profile.photoUri }} style={styles.avatarPhoto} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(name)}</Text>
                )}
              </View>
              <View style={styles.heroGreeting}>
                <Text style={styles.greetingLine}>{greeting()},</Text>
                <Text style={styles.nameLine}>{name}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          </View>

          {/* Cycling headline */}
          <Animated.Text
            style={[styles.heroHeadline, { opacity: headlineFade, transform: [{ translateY: headlineLift }] }]}
          >
            {HERO_HEADLINES[headlineIdx]}
          </Animated.Text>

          {/* CTA — Graphite + Neon Green premium button */}
          <Animated.View style={[styles.startBtnGlow, { opacity: glowAnim }]} pointerEvents="none" />
          <TouchableOpacity style={styles.startBtn} onPress={handleStartGhosting} activeOpacity={0.85}>
            <View style={styles.startBtnInner}>
              <Ionicons name="flash" size={20} color="#00E676" />
              <Text style={styles.startBtnText}>START SESSION</Text>
              <View style={styles.startBtnArrow}>
                <Ionicons name="chevron-forward" size={16} color="#00E676" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CONFIGURE DRILL — Primary action, high visibility ── */}
        <TouchableOpacity style={styles.configCard} onPress={openDrillConfig} activeOpacity={0.82}>
          <View style={styles.configIconBox}>
            <Ionicons name="options" size={26} color={Colors.brand} />
          </View>
          <View style={styles.configTextBlock}>
            <Text style={styles.configTitle}>Configure Drill</Text>
            <Text style={styles.configSub}>Set drill type, intensity, shots & duration</Text>
          </View>
          <View style={styles.configArrow}>
            <Ionicons name="chevron-forward" size={20} color={Colors.brand} />
          </View>
        </TouchableOpacity>

        {/* ── THIS WEEK ────────────────────────────────────────── */}
        <View style={styles.weekCard}>
          <Text style={styles.weekLabel}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            <View style={styles.weekStat}>
              <Ionicons name="flame" size={18} color="#FF4500" />
              <Text style={styles.weekVal}>{stats.currentStreak}</Text>
              <Text style={styles.weekLbl}>Streak</Text>
            </View>
            <View style={styles.weekDivider} />
            <View style={styles.weekStat}>
              <Ionicons name="timer-outline" size={18} color={Colors.accentProgress} />
              <Text style={styles.weekVal}>{weekMinutes}</Text>
              <Text style={styles.weekLbl}>Mins</Text>
            </View>
            <View style={styles.weekDivider} />
            <View style={styles.weekStat}>
              <Ionicons name="body-outline" size={18} color={Colors.accentRoutines} />
              <Text style={styles.weekVal}>{weekMovements}</Text>
              <Text style={styles.weekLbl}>Moves</Text>
            </View>
            <View style={styles.weekDivider} />
            <View style={styles.weekStat}>
              <Ionicons name="calendar-outline" size={18} color={Colors.accentLibrary} />
              <Text style={styles.weekVal}>{weekSessions}</Text>
              <Text style={styles.weekLbl}>Sessions</Text>
            </View>
          </View>
        </View>

        {/* ── QUICK ACTIONS ───────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: Colors.brand }]}
            onPress={handleStartGhosting}
            activeOpacity={0.82}
          >
            <Ionicons name="body" size={28} color={Colors.textPrimary} />
            <Text style={styles.quickTileText}>Ghosting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: Colors.rest }]}
            onPress={handleQuickLastSession}
            activeOpacity={0.82}
          >
            <Ionicons name="time-outline" size={28} color={Colors.textPrimary} />
            <Text style={styles.quickTileText}>Last Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTile, { backgroundColor: Colors.accentRoutines }]}
            onPress={() => navigation.navigate('Routines')}
            activeOpacity={0.82}
          >
            <Ionicons name="list" size={28} color={Colors.textPrimary} />
            <Text style={styles.quickTileText}>Routines</Text>
          </TouchableOpacity>
        </View>

        {/* ── POPULAR DRILLS ───────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Popular Drills</Text>
        <View style={styles.popularRow}>
          {POPULAR_DRILLS.map((drill) => (
            <View key={drill.id} style={styles.popularCard}>
              <View style={[styles.popularIconWrap, { backgroundColor: `${drill.color}1A` }]}>
                <Ionicons name={drill.icon as any} size={22} color={drill.color} />
              </View>
              <View style={[styles.popularBadgePill, { backgroundColor: `${drill.color}22` }]}>
                <Text style={[styles.popularBadgeTxt, { color: drill.color }]}>{drill.badge}</Text>
              </View>
              <Text style={styles.popularCardName} numberOfLines={1}>{drill.name}</Text>
              <Text style={styles.popularCardSub} numberOfLines={2}>{drill.sub}</Text>
              <View style={styles.popularCardFoot}>
                <View style={styles.popularDuration}>
                  <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.popularDurationTxt}>{drill.minutes} min</Text>
                </View>
                <TouchableOpacity
                  style={[styles.popularStartPill, { backgroundColor: drill.color }]}
                  onPress={() => handleStartPopular(drill.base)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="play" size={10} color="#fff" />
                  <Text style={styles.popularStartTxt}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── FROM THE LIBRARY ────────────────────────────────── */}
        <View style={styles.featuredHeader}>
          <Text style={styles.sectionLabel}>From the Library</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Library')}>
            <Text style={styles.seeAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.libraryRow}>
          <LibraryTile
            title="6-Point Ghosting Drill"
            duration="0:22"
            youtubeId="j5CypiAZpoc"
            onPress={() => navigation.navigate('Library')}
          />
          <LibraryTile
            title="10-Point Ghosting Drill"
            duration="0:42"
            youtubeId="WXNJNci6hfo"
            onPress={() => navigation.navigate('Library')}

          />
        </View>

        {/* ── LAST SESSION RECAP ──────────────────────────────── */}
        {lastSession && (
          <>
            <View style={styles.recapHeader}>
              <Text style={styles.sectionLabel}>Last Session Recap</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
                <Text style={styles.seeAll}>See Progress →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lastSessionCard}>
              {/* Top: drill info + score */}
              <View style={styles.lastSessionTop}>
                <View style={styles.lastSessionLeft}>
                  <Text style={styles.lastSessionDrill}>
                    {lastSession.drillType.replace('-', ' ')} · {lastSession.courtSystem.toUpperCase()}
                  </Text>
                  <Text style={styles.lastSessionDate}>
                    {new Date(lastSession.startedAt).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.lastSessionStats}>
                    <Text style={styles.lastSessionStat}>{lastSession.movementsTotal} reps</Text>
                    <Text style={styles.lastSessionDot}>·</Text>
                    <Text style={styles.lastSessionStat}>
                      {Math.round(lastSession.durationSeconds / 60)} min
                    </Text>
                    <Text style={styles.lastSessionDot}>·</Text>
                    <Text style={styles.lastSessionStat}>
                      {Math.round(lastSession.completionPct)}% done
                    </Text>
                  </View>
                </View>
                <View style={styles.lastSessionScore}>
                  <Text style={styles.lastSessionScoreVal}>
                    {Math.round(lastSession.intensityScore)}
                  </Text>
                  <Text style={styles.lastSessionScoreLbl}>score</Text>
                </View>
              </View>
              {/* Bottom: actions */}
              <View style={styles.lastSessionActions}>
                <TouchableOpacity
                  style={styles.recapRepeatBtn}
                  onPress={handleQuickLastSession}
                  activeOpacity={0.82}
                >
                  <Ionicons name="repeat" size={14} color={Colors.textPrimary} />
                  <Text style={styles.recapRepeatTxt}>Repeat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.recapProgressBtn}
                  onPress={() => navigation.navigate('Progress')}
                  activeOpacity={0.82}
                >
                  <Text style={styles.recapProgressTxt}>Full Progress</Text>
                  <Ionicons name="chevron-forward" size={13} color={Colors.brand} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}


      </ScrollView>
    </SafeAreaView>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LibraryTile({ title, duration, youtubeId, onPress }: {
  title: string; duration: string; youtubeId: string; onPress: () => void;
}) {
  const thumbUri = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  return (
    <TouchableOpacity style={libStyles.tile} onPress={onPress} activeOpacity={0.82}>
      <Image source={{ uri: thumbUri }} style={libStyles.thumb} resizeMode="cover" />
      <View style={libStyles.overlay} />
      <View style={libStyles.playBtn}>
        <Ionicons name="play" size={16} color={Colors.textPrimary} />
      </View>
      <View style={libStyles.bottom}>
        <Text style={libStyles.title} numberOfLines={2}>{title}</Text>
        <Text style={libStyles.duration}>{duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

const libStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    minHeight: 130,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  thumb: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.sm,
  },
  playBtn: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  duration: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.6)' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },

  // Hero
  hero: {
    backgroundColor: Colors.heroTrain,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brandMuted,
    borderWidth: 2, borderColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  avatarPhoto: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.brand },
  heroGreeting: { flex: 1 },
  greetingLine: { fontSize: FontSize.caption, color: 'rgba(255,255,255,0.55)', fontWeight: FontWeight.medium },
  nameLine:     { fontSize: FontSize.label, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  signOutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  heroHeadline: {
    fontSize: 34,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: Spacing.xl,
  },
  startBtnGlow: {
    position: 'absolute',
    bottom: Spacing.xxl - 4,
    left: Spacing.base,
    right: Spacing.base,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: '#00E676',
    // Shadow creates the glow on iOS
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 0,
  },
  startBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.full,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#00E676',
    overflow: 'hidden',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  startBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.black,
    color: '#00E676',
    letterSpacing: 2.0,
    flex: 1,
    textAlign: 'center',
  },
  startBtnArrow: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  // This Week compact strip
  weekCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  weekLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  weekDivider: {
    width: 1,
    height: 42,
    backgroundColor: Colors.border,
  },
  weekVal: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  weekLbl: {
    fontSize: FontSize.micro,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Sections
  sectionLabel: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  seeAll: { fontSize: FontSize.label, color: Colors.brand, fontWeight: FontWeight.semiBold },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  quickTile: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 90,
  },
  quickTileText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Popular drills
  popularRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },
  popularCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  popularIconWrap: {
    width: 40, height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  popularBadgePill: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 2,
  },
  popularBadgeTxt: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  popularCardName: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  popularCardSub: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  popularCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  popularDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  popularDurationTxt: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  popularStartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  popularStartTxt: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },

  // Library
  libraryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },

  // Last session recap
  recapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  lastSessionCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  lastSessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  lastSessionLeft:  { flex: 1 },
  lastSessionDrill: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  lastSessionDate: { fontSize: FontSize.caption, color: Colors.textMuted, marginBottom: 6 },
  lastSessionStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastSessionStat:  { fontSize: FontSize.caption, color: Colors.textSecondary },
  lastSessionDot:   { fontSize: FontSize.caption, color: Colors.textMuted },
  lastSessionScore: { alignItems: 'center', marginLeft: Spacing.md },
  lastSessionScoreVal: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
  },
  lastSessionScoreLbl: { fontSize: FontSize.micro, color: Colors.textMuted },
  lastSessionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  recapRepeatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
  },
  recapRepeatTxt: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  recapProgressBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.brand}44`,
    paddingVertical: Spacing.sm,
  },
  recapProgressTxt: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
  },

  configCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: `${Colors.brand}44`,
    padding: Spacing.base,
  },
  configIconBox: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  configTextBlock: { flex: 1 },
  configTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  configSub: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  configArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
});
