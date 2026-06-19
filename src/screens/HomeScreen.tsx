import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, PanResponder, Alert,
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
import HelpModal from './HelpModal';

type PopularBase = Omit<SessionConfig, 'dominantHand' | 'voiceGender' | 'language'>;

const ARTICLE_PREVIEWS = [
  {
    id: '1', icon: 'body-outline' as const, tag: 'TECHNIQUE', tagColor: '#0A84FF',
    title: 'The Science of Squash Footwork',
    summary: 'How biomechanics research is reshaping elite court coverage.',
    readTime: '6 min',
  },
  {
    id: '2', icon: 'timer-outline' as const, tag: 'TRAINING', tagColor: '#FF6B35',
    title: 'Building a 30-Day Ghosting Habit',
    summary: 'A structured progressive plan for sustainable daily practice.',
    readTime: '5 min',
  },
];

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

type ProgramCard = {
  id: string;
  name: string;
  sub: string;
  minutes: number;
  color: string;
  icon: string;
  badge: string;
  type: 'ghosting' | 'drill';
  base?: PopularBase;
};

const PROGRAM_CARDS: ProgramCard[] = [
  {
    id: 'ghosting',
    name: 'Ghosting Drill',
    sub: 'AI-suggested court movement',
    minutes: 15,
    color: '#00E676',
    icon: 'body',
    badge: 'SUGGESTED',
    type: 'ghosting',
  },
  {
    id: '6pt-blast',
    name: '6-Point Blast',
    sub: 'Movement · Random · Advanced',
    minutes: 15,
    color: '#FF9F0A',
    icon: 'body-outline',
    badge: '6PT',
    type: 'drill',
    base: {
      drillType: 'movement', courtSystem: '6pt', coverage: 'full',
      patternType: 'random', tempo: 'explosive', difficulty: 'advanced',
      duration: 15, voiceMode: 'voice+visual', shotGroups: ['mixed'],
      restMode: 'auto', restSeconds: 15,
    },
  },
  {
    id: '10pt-blitz',
    name: '10-Point Blitz',
    sub: 'Movement · Random · Advanced',
    minutes: 20,
    color: '#0A84FF',
    icon: 'flash-outline',
    badge: '10PT',
    type: 'drill',
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
  const { profile, signOut, hasCompletedAuth, hasStartedAnySession } = useProfileStore();
  const { stats, lastSessionCompletedAt, recentSessions } = useProgressStore();
  const settings = useSettingsStore((s) => s.settings);
  const { setPendingConfig, openDrillConfig } = useSessionStore();
  const { loadData } = useProgressLoader();
  const scrollRef      = useRef<ScrollView>(null);
  const prevAuthRef    = useRef(hasCompletedAuth);
  const glowAnim       = useRef(new Animated.Value(0.5)).current;
  const headlineFade   = useRef(new Animated.Value(1)).current;
  const headlineLift   = useRef(new Animated.Value(0)).current;
  const headlineIdxRef = useRef(0);
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [helpVisible, setHelpVisible]       = useState(false);

  const name = profile.name.trim() || 'Player';

  // Pulse glow on Quick Start button
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

  // Cycling hero headlines
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

  // Manual swipe through headlines
  const headlinePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 40) return;
        const dir = gs.dx < 0 ? 1 : -1;
        Animated.timing(headlineFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          const next = (headlineIdxRef.current + HERO_HEADLINES.length + dir) % HERO_HEADLINES.length;
          headlineIdxRef.current = next;
          setHeadlineIdx(next);
          headlineLift.setValue(dir > 0 ? 14 : -14);
          Animated.parallel([
            Animated.timing(headlineFade, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(headlineLift, { toValue: 0, useNativeDriver: true, tension: 130, friction: 10 }),
          ]).start();
        });
      },
    })
  ).current;

  const lastSession = recentSessions[0] ?? null;

  const lsScore      = lastSession ? Math.round(lastSession.intensityScore) : 0;
  const lsScoreColor = lsScore >= 70 ? '#00E676' : lsScore >= 40 ? '#FF9F0A' : '#FF453A';
  const lsCompletion = lastSession ? Math.min(100, Math.round(lastSession.completionPct)) : 0;

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

  // Scroll to top whenever the user completes a fresh sign-in
  useEffect(() => {
    if (hasCompletedAuth && !prevAuthRef.current) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    prevAuthRef.current = hasCompletedAuth;
  }, [hasCompletedAuth]);

  function handleStartGhosting() {
    setPendingConfig({
      ...suggestion.program.config,
      dominantHand: profile.dominantHand,
      voiceGender:  profile.voiceGender,
      language:     profile.language,
      tempo:        settings.defaultTempo,
      difficulty:   settings.defaultDifficulty,
      courtSystem:  settings.defaultCourtSystem,
      voiceMode:    settings.defaultVoiceMode,
    });
  }

  function handleQuickStart() {
    if (!lastSession) { handleStartGhosting(); return; }
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

  function handleStartProgram(card: ProgramCard) {
    if (card.type === 'ghosting') {
      handleStartGhosting();
    } else if (card.base) {
      setPendingConfig({
        ...card.base,
        dominantHand: profile.dominantHand,
        voiceGender:  profile.voiceGender,
        language:     profile.language,
        voiceMode:    settings.defaultVoiceMode,
      });
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ],
    );
  }

  return (
    <>
      <Modal visible={profileVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setProfileVisible(false)}>
        <ProfileScreen onClose={() => setProfileVisible(false)} />
      </Modal>
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO ──────────────────────────────────────────────── */}
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
              <TouchableOpacity onPress={() => setHelpVisible(true)} style={styles.helpBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="help-circle-outline" size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
            </View>

            {/* Cycling headline — swipeable */}
            <View {...headlinePan.panHandlers} style={styles.headlineWrap}>
              <Animated.Text
                style={[styles.heroHeadline, { opacity: headlineFade, transform: [{ translateY: headlineLift }] }]}
              >
                {HERO_HEADLINES[headlineIdx]}
              </Animated.Text>
              <View style={styles.headlineDots}>
                {HERO_HEADLINES.map((_, i) => (
                  <View key={i} style={[styles.headlineDot, i === headlineIdx && styles.headlineDotActive]} />
                ))}
              </View>
            </View>

            {/* Tagline */}
            <Text style={styles.heroTagline}>
              {'Train '}
              <Text style={styles.heroTaglineGreen}>Smart.</Text>
              {'  Move '}
              <Text style={styles.heroTaglineOrange}>Faster.</Text>
              {'  Dominate the Court.'}
            </Text>

            {/* Two-button CTA row */}
            <View style={styles.heroBtns}>
              <View style={styles.quickStartWrapper}>
                <Animated.View style={[styles.quickStartGlow, { opacity: glowAnim }]} pointerEvents="none" />
                <TouchableOpacity style={styles.quickStartBtn} onPress={handleQuickStart} activeOpacity={0.85}>
                  <Ionicons name="flash" size={18} color="#00E676" />
                  <Text style={styles.quickStartTxt}>Quick Start</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.newSessionBtn} onPress={openDrillConfig} activeOpacity={0.85}>
                <Ionicons name="options-outline" size={18} color={Colors.brand} />
                <Text style={styles.newSessionTxt}>New Session</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── FIRST-RUN GUIDANCE (PQA-11) ───────────────────────── */}
          {!hasStartedAnySession && (
            <View style={styles.firstRunCard}>
              <View style={styles.firstRunIconRow}>
                <View style={styles.firstRunIconCircle}>
                  <Ionicons name="rocket-outline" size={28} color={Colors.brand} />
                </View>
              </View>
              <Text style={styles.firstRunTitle}>Your first session awaits</Text>
              <Text style={styles.firstRunBody}>
                Tap <Text style={styles.firstRunEmphasis}>Quick Start</Text> above for an instant session, or{' '}
                <Text style={styles.firstRunEmphasis}>New Session</Text> to pick your drill type, difficulty, and duration.
              </Text>
              <View style={styles.firstRunSteps}>
                {[
                  { icon: 'footsteps-outline' as const, text: 'Start on the T in the middle of the court' },
                  { icon: 'volume-high-outline' as const, text: 'Listen for position calls and move to each spot' },
                  { icon: 'refresh-outline' as const, text: 'Always recover back to T between calls' },
                ].map(({ icon, text }) => (
                  <View key={text} style={styles.firstRunStep}>
                    <Ionicons name={icon} size={16} color={Colors.brand} />
                    <Text style={styles.firstRunStepText}>{text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── LAST SESSION ──────────────────────────────────────── */}
          {lastSession && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Last Session</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
                  <Text style={styles.seeAll}>See Progress →</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.lastSessionCard, { borderTopColor: lsScoreColor }]}>

                {/* Header: drill icon + name/date + score badge */}
                <View style={styles.lsHeader}>
                  <View style={[styles.lsDrillIconBox, { backgroundColor: `${lsScoreColor}18` }]}>
                    <Ionicons name="body-outline" size={20} color={lsScoreColor} />
                  </View>
                  <View style={styles.lsHeaderText}>
                    <Text style={styles.lsDrillName} numberOfLines={1}>
                      {lastSession.drillType.replace(/-/g, ' ')} · {lastSession.courtSystem.toUpperCase()}
                    </Text>
                    <Text style={styles.lsDate}>
                      {new Date(lastSession.startedAt).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.lsScoreBadge, { borderColor: `${lsScoreColor}66` }]}>
                    <Text style={[styles.lsScoreVal, { color: lsScoreColor }]}>{lsScore}</Text>
                    <Text style={styles.lsScoreLbl}>SCORE</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={styles.lsStatsRow}>
                  <View style={styles.lsStat}>
                    <Text style={styles.lsStatVal}>{lastSession.movementsTotal}</Text>
                    <Text style={styles.lsStatLbl}>Reps</Text>
                  </View>
                  <View style={styles.lsStatDiv} />
                  <View style={styles.lsStat}>
                    <Text style={styles.lsStatVal}>{Math.round(lastSession.durationSeconds / 60)}</Text>
                    <Text style={styles.lsStatLbl}>Mins</Text>
                  </View>
                  <View style={styles.lsStatDiv} />
                  <View style={styles.lsStat}>
                    <Text style={[styles.lsStatVal, { color: lsScoreColor }]}>{lsCompletion}%</Text>
                    <Text style={styles.lsStatLbl}>Done</Text>
                  </View>
                </View>

                {/* Completion progress bar */}
                <View style={styles.lsProgressTrack}>
                  <View style={[styles.lsProgressFill, {
                    width: `${lsCompletion}%` as any,
                    backgroundColor: lsScoreColor,
                  }]} />
                </View>

                {/* Actions */}
                <View style={styles.lsActions}>
                  <TouchableOpacity
                    style={[styles.lsRepeatBtn, { backgroundColor: lsScoreColor }]}
                    onPress={handleQuickStart}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="repeat" size={16} color="#000" />
                    <Text style={styles.lsRepeatTxt}>Repeat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.lsProgressBtn}
                    onPress={() => navigation.navigate('Progress')}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.lsProgressTxt}>Full Progress</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.brand} />
                  </TouchableOpacity>
                </View>

              </View>
            </>
          )}

          {/* ── THIS WEEK ─────────────────────────────────────────── */}
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

          {/* ── PROGRAMS ──────────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Programs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Routines')}>
              <Text style={styles.seeAll}>Browse All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.programsScroll}
            style={styles.programsScrollView}
          >
            {PROGRAM_CARDS.map((card) => (
              <View key={card.id} style={styles.programCard}>
                <View style={[styles.programIconWrap, { backgroundColor: `${card.color}18` }]}>
                  <Ionicons name={card.icon as any} size={26} color={card.color} />
                </View>
                <View style={[styles.programBadgePill, { backgroundColor: `${card.color}22` }]}>
                  <Text style={[styles.programBadgeTxt, { color: card.color }]}>{card.badge}</Text>
                </View>
                <Text style={styles.programCardName} numberOfLines={1}>{card.name}</Text>
                <Text style={styles.programCardSub} numberOfLines={2}>{card.sub}</Text>
                <View style={styles.programCardFoot}>
                  <View style={styles.programDuration}>
                    <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.programDurationTxt}>{card.minutes} min</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.programStartPill, { backgroundColor: card.color }]}
                    onPress={() => handleStartProgram(card)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="play" size={10} color="#fff" />
                    <Text style={styles.programStartTxt}>Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* ── FROM THE LIBRARY ──────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
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

          {/* ── TRAINING TIPS ─────────────────────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Training Tips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Library')}>
              <Text style={styles.seeAll}>Read all</Text>
            </TouchableOpacity>
          </View>
          {ARTICLE_PREVIEWS.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={styles.articleTile}
              onPress={() => navigation.navigate('Library', { articleId: a.id } as any)}
              activeOpacity={0.82}
            >
              <View style={[styles.articleIconBox, { backgroundColor: `${a.tagColor}18` }]}>
                <Ionicons name={a.icon} size={20} color={a.tagColor} />
              </View>
              <View style={styles.articleBody}>
                <View style={[styles.articleTagPill, { backgroundColor: `${a.tagColor}18` }]}>
                  <Text style={[styles.articleTagText, { color: a.tagColor }]}>{a.tag}</Text>
                </View>
                <Text style={styles.articleTitle} numberOfLines={2}>{a.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={2}>{a.summary}</Text>
              </View>
              <View style={styles.articleRight}>
                <Text style={styles.articleReadTime}>{a.readTime}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LibraryTile({ title, duration, youtubeId, onPress }: {
  title: string; duration: string; youtubeId: string; onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const thumbUri = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  return (
    <TouchableOpacity style={libStyles.tile} onPress={onPress} activeOpacity={0.82}>
      {!imgError && (
        <Image source={{ uri: thumbUri }} style={libStyles.thumb} resizeMode="cover" onError={() => setImgError(true)} />
      )}
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

  // ── First-run guidance card
  firstRunCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: `${Colors.brand}40`,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  firstRunIconRow:    { alignItems: 'center' },
  firstRunIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  firstRunTitle:    { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  firstRunBody:     { fontSize: FontSize.label, color: Colors.textMuted, lineHeight: 20, textAlign: 'center' },
  firstRunEmphasis: { color: Colors.brand, fontWeight: FontWeight.semiBold },
  firstRunSteps:    { gap: Spacing.sm, marginTop: Spacing.xs },
  firstRunStep:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  firstRunStepText: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },

  // ── Hero
  hero: {
    backgroundColor: Colors.heroTrain,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
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
  helpBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
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
  headlineWrap: { alignItems: 'center' },
  heroHeadline: {
    fontSize: 34,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  headlineDots: {
    flexDirection: 'row', gap: 5, marginBottom: Spacing.sm,
  },
  heroTagline: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  heroTaglineGreen:  { color: '#34C759', fontWeight: FontWeight.bold },
  heroTaglineOrange: { color: Colors.brand, fontWeight: FontWeight.bold },
  headlineDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  headlineDotActive: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    width: 14,
  },

  // Two-button CTA
  heroBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickStartWrapper: {
    flex: 3,
    position: 'relative',
  },
  quickStartGlow: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#00E676',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 0,
  },
  quickStartBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.full,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#00E676',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStartTxt: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.black,
    color: '#00E676',
    letterSpacing: 1.2,
  },
  newSessionBtn: {
    flex: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.full,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  newSessionTxt: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
    letterSpacing: 0.8,
  },

  // ── Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAll: { fontSize: FontSize.label, color: Colors.brand, fontWeight: FontWeight.semiBold },

  // ── This Week compact strip
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

  // ── Programs horizontal scroll
  programsScrollView: {
    marginBottom: Spacing.xl,
  },
  programsScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  programCard: {
    width: 162,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  programIconWrap: {
    width: 44, height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  programBadgePill: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 2,
  },
  programBadgeTxt: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  programCardName: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  programCardSub: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  programCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  programDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  programDurationTxt: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  programStartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  programStartTxt: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },

  // ── Library
  libraryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
  },

  // ── Training Tips articles
  articleTile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  articleIconBox: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  articleBody: { flex: 1, gap: 4 },
  articleTagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  articleTagText: { fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  articleTitle: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  articleSummary: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  articleRight: { alignItems: 'flex-end', flexShrink: 0 },
  articleReadTime: { fontSize: FontSize.caption, color: Colors.textMuted },

  // ── Last session card
  lastSessionCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  lsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    paddingBottom: Spacing.md,
  },
  lsDrillIconBox: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  lsHeaderText: { flex: 1 },
  lsDrillName: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 3,
  },
  lsDate: { fontSize: FontSize.caption, color: Colors.textMuted },
  lsScoreBadge: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  lsScoreVal: {
    fontSize: 22,
    fontWeight: FontWeight.black,
    lineHeight: 26,
  },
  lsScoreLbl: {
    fontSize: 8,
    color: Colors.textMuted,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.8,
  },
  lsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.base,
  },
  lsStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  lsStatDiv: { width: 1, height: 28, backgroundColor: Colors.border },
  lsStatVal: {
    fontSize: FontSize.sectionHeader,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  lsStatLbl: {
    fontSize: FontSize.micro,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  lsProgressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lsProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  lsActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  lsRepeatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  lsRepeatTxt: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: '#000',
  },
  lsProgressBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand,
    paddingVertical: Spacing.md,
  },
  lsProgressTxt: {
    fontSize: FontSize.label,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
  },
});
