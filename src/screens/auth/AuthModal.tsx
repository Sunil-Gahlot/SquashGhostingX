import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Alert,
  ActivityIndicator, Linking, FlatList, useWindowDimensions, Keyboard,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/layout';
import { useProfileStore } from '../../stores/profileStore';
import { LANGUAGE_OPTIONS } from '../../constants/languages';
import TermsConsentModal from '../TermsConsentModal';

// ─── Welcome slides ───────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'move',
    icon: 'body' as const,
    label: 'MOVEMENT',
    title: 'Train Hard.\nPlay Fearless.',
    sub: 'AI-guided ghosting patterns that push your limits — built for every level of player.',
    color: Colors.brand,
  },
  {
    id: 'track',
    icon: 'bar-chart' as const,
    label: 'ANALYTICS',
    title: 'Track Every\nMovement',
    sub: 'Personal bests, streaks, court balance and zone analytics — all automatic.',
    color: Colors.accentProgress,
  },
  {
    id: 'programs',
    icon: 'trophy' as const,
    label: 'PROGRAMS',
    title: 'World-Class\nPrograms',
    sub: 'From Beginner to PSA Pro — structured routines built for every level.',
    color: Colors.accentRoutines,
  },
  {
    id: 'speed',
    icon: 'flash' as const,
    label: 'SPEED',
    title: 'Move Faster.\nReact Smarter.',
    sub: 'Progressive speed drills build explosive first-step quickness and total court coverage.',
    color: Colors.accentLibrary,
  },
  {
    id: 'coach',
    icon: 'mic' as const,
    label: 'COACHING',
    title: 'Your Personal\nCourt Coach.',
    sub: 'Real-time voice calls and recovery cues guide every rep, completely hands-free.',
    color: Colors.gold,
  },
  {
    id: 'match',
    icon: 'shield-checkmark' as const,
    label: 'MATCH READY',
    title: 'Own Every\nMatch Day.',
    sub: 'Match simulation drills mirror real game patterns so you\'re never caught off guard.',
    color: Colors.accentSettings,
  },
] as const;

const AUTH_CREDENTIALS_KEY = 'sgx-user-credentials';

type StoredCreds =
  | { version: 2; email: string; passwordHash: string }
  | { email: string; password: string };

async function hashPassword(pw: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pw);
}

// ─── Welcome page ─────────────────────────────────────────────────────────────

const SLIDE_STATS = [
  ['500+ Drills', '6-Point System', 'AI-Guided'],
  ['Auto Tracked', 'Personal Bests', 'Zone Analytics'],
  ['Beginner → Pro', 'Structured Plans', 'PSA Tested'],
  ['Explosive Speed', '10-Point Court', 'Full Coverage'],
  ['Voice + Visual', 'Hands-Free', 'Multi-Language'],
  ['Match Simulation', 'Real Patterns', 'Game Ready'],
] as const;

function WelcomePage({
  onGetStarted,
  onSignIn,
  onGuest,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
  onGuest: () => void;
}) {
  const { width: SCREEN_W } = useWindowDimensions();
  const [idx, setIdx]       = useState(0);
  const glowAnim            = useRef(new Animated.Value(0.5)).current;
  const bgGlowAnim          = useRef(new Animated.Value(0.10)).current;
  const idxRef              = useRef(0);
  const flatListRef         = useRef<FlatList>(null);
  const isSwipingRef        = useRef(false);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);

  const slide = SLIDES[idx];

  function startAutoRotate() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isSwipingRef.current) return;
      const next = (idxRef.current + 1) % SLIDES.length;
      idxRef.current = next;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setIdx(next);
    }, 4200);
  }

  useEffect(() => {
    startAutoRotate();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,   { toValue: 1.0,  duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim,   { toValue: 0.35, duration: 1800, useNativeDriver: false }),
      ])
    );
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlowAnim, { toValue: 0.18, duration: 3200, useNativeDriver: false }),
        Animated.timing(bgGlowAnim, { toValue: 0.07, duration: 3200, useNativeDriver: false }),
      ])
    );
    iconLoop.start(); bgLoop.start();
    return () => { iconLoop.stop(); bgLoop.stop(); };
  }, []);

  function scrollToIdx(i: number) {
    idxRef.current = i;
    flatListRef.current?.scrollToIndex({ index: i, animated: true });
    setIdx(i);
    startAutoRotate();
  }

  function onScrollBeginDrag() {
    isSwipingRef.current = true;
  }

  function onMomentumScrollEnd(e: any) {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    idxRef.current = newIdx;
    setIdx(newIdx);
    isSwipingRef.current = false;
    startAutoRotate();
  }

  const renderSlide = useCallback(({ item, index }: { item: typeof SLIDES[number]; index: number }) => {
    const stats = SLIDE_STATS[index];
    return (
      <View style={{ width: SCREEN_W, height: '100%', paddingHorizontal: Spacing.base }}>
        <View style={[wStyles.card, { borderTopColor: item.color }]}>
          <Animated.View style={[wStyles.cardCornerGlow, { backgroundColor: item.color, opacity: glowAnim }]} />
          <View style={[wStyles.labelBadge, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
            <Ionicons name={item.icon} size={11} color={item.color} />
            <Text style={[wStyles.slideLabel, { color: item.color }]}>{item.label}</Text>
          </View>
          <View style={[wStyles.iconCircle, { backgroundColor: `${item.color}15` }]}>
            <Ionicons name={item.icon} size={52} color={item.color} />
          </View>
          <Text style={wStyles.slideTitle}>{item.title}</Text>
          <Text style={wStyles.slideSub}>{item.sub}</Text>
          <View style={wStyles.statsRow}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat}>
                <Text style={wStyles.statText}>{stat}</Text>
                {i < stats.length - 1 && <View style={wStyles.statDot} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    );
  }, [SCREEN_W, glowAnim]);

  return (
    <View style={wStyles.container}>
      {/* Atmospheric background glow */}
      <Animated.View
        style={[wStyles.bgGlow, { backgroundColor: slide.color, opacity: bgGlowAnim }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[wStyles.bgGlow2, { backgroundColor: slide.color, opacity: bgGlowAnim }]}
        pointerEvents="none"
      />

      {/* Brand pill */}
      <View style={wStyles.brand}>
        <View style={wStyles.brandIcon}>
          <Ionicons name="body" size={20} color={Colors.brand} />
        </View>
        <Text style={wStyles.brandName}>
          {'Squash '}
          <Text style={wStyles.brandNameAccent}>GhostingX</Text>
        </Text>
      </View>

      {/* Tagline */}
      <Text style={wStyles.tagline}>
        {'Train '}
        <Text style={wStyles.taglineGreen}>Smart.</Text>
        <Text style={wStyles.taglineSep}>{' · '}</Text>
        {'Move '}
        <Text style={wStyles.taglineOrange}>Faster.</Text>
        <Text style={wStyles.taglineSep}>{' · '}</Text>
        {'Dominate the Court.'}
      </Text>

      {/* Slides — native horizontal paging */}
      <FlatList
        ref={flatListRef}
        data={SLIDES as unknown as any[]}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        style={[wStyles.flatList, { marginHorizontal: -Spacing.base }]}
      />

      {/* Pagination dots */}
      <View style={wStyles.dots}>
        {SLIDES.map((s, i) => (
          <TouchableOpacity key={s.id} onPress={() => scrollToIdx(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={[wStyles.dot, i === idx && { width: 28, backgroundColor: slide.color }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTAs */}
      <TouchableOpacity
        style={[wStyles.getStartedBtn, { shadowColor: slide.color }]}
        onPress={onGetStarted}
        activeOpacity={0.88}
      >
        <Text style={wStyles.getStartedText}>Create Account</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} />
      </TouchableOpacity>

      <TouchableOpacity style={wStyles.signInBtn} onPress={onSignIn} activeOpacity={0.75}>
        <Text style={wStyles.signInBtnText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={wStyles.guestBtn} onPress={onGuest} activeOpacity={0.75}>
        <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
        <Text style={wStyles.guestBtnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const wStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },

  // Atmospheric background blobs
  bgGlow: {
    position: 'absolute',
    width: 320, height: 320,
    borderRadius: 160,
    top: -40, right: -60,   // kept inside the safe-area container, no bleed into status bar
  },
  bgGlow2: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    bottom: 120, left: -60,
    opacity: 0.05,
  },

  // Brand header
  brand: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    alignSelf: 'stretch',   // full width so flex:1 on brandName has a defined basis
    marginBottom: Spacing.lg,
  },
  brandIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.brand}30`,
  },
  brandName: {
    fontSize: 26,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 0.1,
    flex: 1,
    flexShrink: 1,
  },
  brandNameAccent: {
    color: Colors.brand,
  },

  // Tagline
  tagline: {
    fontSize: 16,
    fontWeight: FontWeight.semiBold,
    color: 'rgba(255,255,255,0.80)',
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  taglineGreen:  { color: '#34C759', fontWeight: FontWeight.bold },
  taglineOrange: { color: Colors.brand, fontWeight: FontWeight.bold },
  taglineSep:    { color: 'rgba(255,255,255,0.40)', fontWeight: FontWeight.regular },

  // FlatList — fills remaining vertical space; escape container's horizontal padding via negative margin
  flatList: {
    flex: 1,
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },

  // Slide card — fills the item height
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  cardCornerGlow: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    top: -80, right: -80,
    opacity: 0.06,
  },

  // Label badge
  labelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  slideLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.black,
    letterSpacing: 1.8,
  },

  // Icon
  iconCircle: {
    width: 92, height: 92,
    borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
  },

  // Text
  slideTitle: {
    fontSize: 30,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  slideSub: {
    fontSize: FontSize.label,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  statText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  statDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: Colors.textDisabled,
  },

  // Pagination
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },

  // CTAs
  getStartedBtn: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  getStartedText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.black,
    color: Colors.textInverse,
    letterSpacing: 0.6,
  },

  signInBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  signInBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },

  guestBtn: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  guestBtnText: {
    fontSize: FontSize.label,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});

// ─── Auth page ────────────────────────────────────────────────────────────────

const AUTH_ATTEMPTS_KEY = 'sgx-auth-attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

interface AttemptRecord { count: number; lockedUntil: number; }

async function getAttempts(): Promise<AttemptRecord> {
  try {
    const stored = await SecureStore.getItemAsync(AUTH_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : { count: 0, lockedUntil: 0 };
  } catch { return { count: 0, lockedUntil: 0 }; }
}

function AuthPage({
  initialTab,
  onComplete,
  onBack,
}: {
  initialTab: 'register' | 'login';
  onComplete: (email?: string) => void;
  onBack: () => void;
}) {
  const [tab,             setTab]             = useState<'register' | 'login'>(initialTab);
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  function switchTab(t: 'register' | 'login') {
    setTab(t);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleEmailAuth() {
    setError('');

    // Check lockout before doing anything else
    const attempts = await getAttempts();
    if (attempts.lockedUntil > Date.now()) {
      const minsLeft = Math.ceil((attempts.lockedUntil - Date.now()) / 60_000);
      setError(`Too many failed attempts. Try again in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}.`);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const stored = await SecureStore.getItemAsync(AUTH_CREDENTIALS_KEY);
      const creds: StoredCreds | null = stored ? JSON.parse(stored) : null;

      if (tab === 'register') {
        if (creds?.email === trimmedEmail) {
          setError('An account with this email already exists. Try signing in.');
          setLoading(false);
          return;
        }
        // BUG-004: allow a different email to register — overwrite the stored credentials
        // so a second user (family member, new owner) can use the device.
        // The previous account data remains in the local DB but the new credentials take over.
        const passwordHash = await hashPassword(password);
        await SecureStore.setItemAsync(
          AUTH_CREDENTIALS_KEY,
          JSON.stringify({ email: trimmedEmail, passwordHash, version: 2 })
        );
        await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_KEY).catch(() => {});
        onComplete(trimmedEmail);
      } else {
        let passwordMatch = false;
        if (creds && creds.email === trimmedEmail) {
          if ('version' in creds && creds.version === 2) {
            // New format: compare hashes
            const inputHash = await hashPassword(password);
            passwordMatch = inputHash === creds.passwordHash;
          } else if ('password' in creds) {
            // Legacy plain-text format: direct compare, then upgrade on success
            if (creds.password === password) {
              passwordMatch = true;
              const passwordHash = await hashPassword(password);
              await SecureStore.setItemAsync(
                AUTH_CREDENTIALS_KEY,
                JSON.stringify({ email: trimmedEmail, passwordHash, version: 2 })
              ).catch(() => {});
            }
          }
        }

        if (!passwordMatch) {
          const newCount = attempts.count + 1;
          const lockedUntil = newCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
          await SecureStore.setItemAsync(AUTH_ATTEMPTS_KEY, JSON.stringify({ count: newCount, lockedUntil })).catch(() => {});
          if (newCount >= MAX_LOGIN_ATTEMPTS) {
            setError('Too many failed attempts. Account locked for 5 minutes.');
          } else {
            const remaining = MAX_LOGIN_ATTEMPTS - newCount;
            setError(`Incorrect email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
          }
          setLoading(false);
          return;
        }
        // Success — clear attempt counter
        await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_KEY).catch(() => {});
        onComplete(trimmedEmail);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert(
        'Forgot Password',
        'Enter your email address above, then tap Forgot Password.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Reset Password',
      `This app stores your password locally on this device only — there is no server reset link.\n\nTapping Reset will clear the saved password for ${trimmedEmail}. You can then register again with a new password. Your training data will not be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await SecureStore.getItemAsync(AUTH_CREDENTIALS_KEY);
              const creds: StoredCreds | null = stored ? JSON.parse(stored) : null;
              if (!creds || creds.email !== trimmedEmail) {
                setError('No account found for that email address.');
                return;
              }
              await SecureStore.deleteItemAsync(AUTH_CREDENTIALS_KEY);
              await SecureStore.deleteItemAsync(AUTH_ATTEMPTS_KEY).catch(() => {});
              setPassword('');
              setConfirmPassword('');
              setError('');
              switchTab('register');
              Alert.alert(
                'Password Reset',
                'Your credentials have been cleared. Create a new password to continue.',
                [{ text: 'OK' }]
              );
            } catch {
              setError('Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  }

  const isRegister = tab === 'register';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={aStyles.scroll}
        contentContainerStyle={aStyles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={onBack} style={aStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Brand mark */}
          <View style={aStyles.brandRow}>
            <View style={aStyles.brandMark}>
              <Ionicons name="body" size={14} color={Colors.brand} />
            </View>
            <Text style={aStyles.brandLabel}>SquashGhostingX</Text>
          </View>

          {/* Tab switcher */}
          <View style={aStyles.tabRow}>
            <TouchableOpacity
              style={[aStyles.tabBtn, tab === 'register' && aStyles.tabBtnActive]}
              onPress={() => switchTab('register')}
            >
              <Text style={[aStyles.tabText, tab === 'register' && aStyles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[aStyles.tabBtn, tab === 'login' && aStyles.tabBtnActive]}
              onPress={() => switchTab('login')}
            >
              <Text style={[aStyles.tabText, tab === 'login' && aStyles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email form */}
          <View style={aStyles.formGroup}>
            <View style={aStyles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={aStyles.inputIcon} />
              <TextInput
                style={aStyles.input}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                placeholder="Email address"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={aStyles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={aStyles.inputIcon} />
              <TextInput
                style={[aStyles.input, aStyles.inputWithToggle]}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType={isRegister ? 'next' : 'done'}
                onSubmitEditing={isRegister ? undefined : handleEmailAuth}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={aStyles.showHide}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {isRegister && (
              <View style={aStyles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={aStyles.inputIcon} />
                <TextInput
                  style={aStyles.input}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleEmailAuth}
                />
              </View>
            )}
          </View>

          {/* Forgot password (login only) */}
          {!isRegister && (
            <TouchableOpacity
              style={aStyles.forgotBtn}
              onPress={handleForgotPassword}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={aStyles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error ? (
            <View style={aStyles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
              <Text style={aStyles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={aStyles.submitBtn}
            onPress={handleEmailAuth}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Text style={aStyles.submitText}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
              </>
            )}
          </TouchableOpacity>

          {/* Legal disclosure — shown on Create Account tab only (Apple 5.1.1) */}
          {isRegister && (
            <Text style={aStyles.legalText}>
              By creating an account, you agree to our{' '}
              <Text style={aStyles.legalLink} onPress={() => Linking.openURL('https://squashghostingx.com/terms')}>
                Terms of Use
              </Text>
              {' '}and{' '}
              <Text style={aStyles.legalLink} onPress={() => Linking.openURL('https://squashghostingx.com/privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          )}

          {/* Guest mode */}
          <View style={aStyles.dividerRow}>
            <View style={aStyles.dividerLine} />
            <Text style={aStyles.dividerText}>or</Text>
            <View style={aStyles.dividerLine} />
          </View>

          <TouchableOpacity
            style={aStyles.guestBtn}
            onPress={() => onComplete()}
            activeOpacity={0.75}
          >
            <Ionicons name="person-outline" size={18} color={Colors.brand} />
            <Text style={aStyles.guestText}>Continue as Guest</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.brand} />
          </TouchableOpacity>
          <Text style={aStyles.guestNote}>
            All data stays on this device. You can create an account anytime.
          </Text>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const aStyles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing.xl },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },

  brandRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  brandMark: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  brandLabel: {
    fontSize: 22, fontWeight: FontWeight.black,
    color: Colors.textPrimary,
  },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.lg,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  tabText: {
    fontSize: FontSize.label, color: Colors.textMuted, fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.textPrimary, fontWeight: FontWeight.bold,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flexShrink: 0,
  },

  // Form
  formGroup: { gap: Spacing.sm, marginBottom: Spacing.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    height: 52, paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm, flexShrink: 0 },
  input: {
    flex: 1, fontSize: FontSize.body,
    color: Colors.textPrimary,
    height: '100%',
  },
  inputWithToggle: { paddingRight: Spacing.xl },
  showHide: { position: 'absolute', right: Spacing.md },

  // Forgot password
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    fontSize: FontSize.caption,
    color: Colors.brand,
    fontWeight: FontWeight.medium,
  },

  // Error
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.md,
    backgroundColor: `${Colors.danger}14`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1, borderColor: `${Colors.danger}30`,
  },
  errorText: { fontSize: FontSize.caption, color: Colors.danger, flex: 1 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    height: 54,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: {
    fontSize: FontSize.body, fontWeight: FontWeight.black,
    color: Colors.textInverse, letterSpacing: 0.3,
  },

  // Guest
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.42)',
    backgroundColor: 'rgba(255,107,53,0.10)',
  },
  guestText: {
    fontSize: FontSize.label, color: Colors.brand, fontWeight: FontWeight.semiBold,
  },
  guestNote: {
    fontSize: FontSize.caption, color: Colors.textMuted,
    textAlign: 'center', marginTop: Spacing.sm, lineHeight: 18,
  },

  legalText: {
    fontSize: FontSize.caption, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 18,
    marginBottom: Spacing.md,
  },
  legalLink: {
    color: Colors.brand,
    fontWeight: FontWeight.medium,
  },
});

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function AuthModal() {
  const { profile, hasCompletedAuth, hasAcceptedTerms, isOnboardingComplete, completeAuth, completeOnboarding, setProfile } = useProfileStore();

  const [page, setPage] = useState<'welcome' | 'register' | 'login' | 'guest-name' | 'guest-prefs' | 'terms'>('welcome');
  // Stores the email for the email-auth path so the terms page can complete auth after acceptance.
  const pendingEmailRef = useRef<string | undefined>(undefined);

  // Reset to welcome whenever auth is cleared (sign-out or delete account).
  useEffect(() => {
    if (!hasCompletedAuth) setPage('welcome');
  }, [hasCompletedAuth]);

  // Once T&C is accepted on the terms page, complete auth automatically.
  useEffect(() => {
    if (page === 'terms' && hasAcceptedTerms && !hasCompletedAuth) {
      const email = pendingEmailRef.current;
      pendingEmailRef.current = undefined;
      completeAuth(email);
      if (!email) completeOnboarding(); // guest path only
    }
  }, [page, hasAcceptedTerms, hasCompletedAuth]);

  // Already logged in — nothing to show.
  if (hasCompletedAuth) return null;
  // Terms page: show T&C as the final step before entering the app.
  // Returned outside the main Modal so it renders as its own full-screen overlay.
  if (page === 'terms') return <TermsConsentModal />;

  function goToTerms(email?: string) {
    pendingEmailRef.current = email;
    setPage('terms');
  }

  function handleAuthComplete(email?: string) {
    if (!email) {
      // Returning guest (has name + completed onboarding) — show T&C if not accepted, else complete.
      if (profile.name.trim() && isOnboardingComplete) {
        if (!hasAcceptedTerms) { goToTerms(); return; }
        completeAuth(undefined);
        return;
      }
      setPage('guest-name');
      return;
    }
    if (!profile.name) {
      setProfile({ name: email.split('@')[0] });
    }
    // Email auth: show T&C if not yet accepted (first account or after deletion).
    if (!hasAcceptedTerms) { goToTerms(email); return; }
    completeAuth(email);
  }

  function handleGuestNameContinue(name: string, gender: string, dobMonth: string, dobDay: string, dobYear: string) {
    setProfile({
      ...(name.trim() ? { name: name.trim() } : {}),
      gender: gender as any,
      dobMonth, dobDay, dobYear,
    });
    setPage('guest-prefs');
  }

  function handleGuestPrefsContinue(skill: string, hand: string, voiceGender: string, language: string) {
    // gender already set in GuestNamePage — do not override here.
    setProfile({
      skillLevel: skill as any,
      dominantHand: hand as any,
      voiceGender: voiceGender as any,
      language: language as any,
    });
    // Show T&C as the final step before completing guest setup.
    if (!hasAcceptedTerms) { goToTerms(); return; }
    completeAuth(undefined);
    completeOnboarding();
  }

  return (
    <Modal
      visible={!hasCompletedAuth}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <SafeAreaProvider>
      <SafeAreaView style={modalStyles.safe} edges={['top', 'bottom']}>
        {page === 'welcome' && (
          <WelcomePage
            onGetStarted={() => setPage('register')}
            onSignIn={() => setPage('login')}
            onGuest={() => handleAuthComplete()}
          />
        )}
        {(page === 'register' || page === 'login') && (
          <AuthPage
            initialTab={page}
            onComplete={handleAuthComplete}
            onBack={() => setPage('welcome')}
          />
        )}
        {page === 'guest-name' && (
          <GuestNamePage
            onContinue={handleGuestNameContinue}
            onBack={() => setPage('welcome')}
          />
        )}
        {page === 'guest-prefs' && (
          <GuestPrefsPage
            onContinue={handleGuestPrefsContinue}
            onBack={() => setPage('guest-name')}
          />
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
});

// ─── DOB picker data ──────────────────────────────────────────────────────────

const DOB_MONTHS = [
  { label: 'January',   value: '01' }, { label: 'February',  value: '02' },
  { label: 'March',     value: '03' }, { label: 'April',     value: '04' },
  { label: 'May',       value: '05' }, { label: 'June',      value: '06' },
  { label: 'July',      value: '07' }, { label: 'August',    value: '08' },
  { label: 'September', value: '09' }, { label: 'October',   value: '10' },
  { label: 'November',  value: '11' }, { label: 'December',  value: '12' },
];
const DOB_DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, '0');
  return { label: d, value: d };
});
const _cy = new Date().getFullYear();
const DOB_YEARS = Array.from({ length: _cy - 1919 }, (_, i) => {
  const y = String(_cy - i);
  return { label: y, value: y };
});

// ─── DOB picker: three inline chips → single shared bottom sheet ─────────────

const DOB_SHEET_ITEM_H = 50;

function DobPickerCombined({
  dobMonth, dobDay, dobYear, onConfirm,
}: {
  dobMonth: string; dobDay: string; dobYear: string;
  onConfirm: (month: string, day: string, year: string) => void;
}) {
  const [openField, setOpenField] = useState<'month' | 'day' | 'year' | null>(null);
  const listRef = useRef<FlatList>(null);

  function openSheet(field: 'month' | 'day' | 'year') {
    Keyboard.dismiss();
    setOpenField(field);
  }

  function select(value: string) {
    if (!openField) return;
    const m = openField === 'month' ? value : dobMonth;
    const d = openField === 'day'   ? value : dobDay;
    const y = openField === 'year'  ? value : dobYear;
    onConfirm(m, d, y);
    setOpenField(null);
  }

  const sheetData  = openField === 'month' ? DOB_MONTHS : openField === 'day' ? DOB_DAYS : openField === 'year' ? DOB_YEARS : [];
  const sheetValue = openField === 'month' ? dobMonth   : openField === 'day' ? dobDay   : dobYear;
  const sheetTitle = openField === 'month' ? 'Month'    : openField === 'day' ? 'Day'    : 'Year';

  const selIdx = sheetData.findIndex(i => i.value === sheetValue);

  useEffect(() => {
    if (openField === null) return;
    const t = setTimeout(() => {
      if (selIdx > 2) listRef.current?.scrollToIndex({ index: selIdx, animated: false, viewPosition: 0.4 });
    }, 60);
    return () => clearTimeout(t);
  }, [openField]);

  const monthLabel = dobMonth ? (DOB_MONTHS.find(m => m.value === dobMonth)?.label ?? '') : '';
  const dayLabel   = dobDay   ? String(parseInt(dobDay, 10))                              : '';
  const yearLabel  = dobYear  ?? '';

  return (
    <>
      {/* Three chips in one row */}
      <View style={dobStyles.row}>
        <TouchableOpacity
          style={[dobStyles.chip, dobStyles.chipWide, dobMonth && dobStyles.chipFilled]}
          onPress={() => openSheet('month')}
          activeOpacity={0.75}
        >
          <Text style={dobMonth ? dobStyles.chipValue : dobStyles.chipPlaceholder} numberOfLines={1}>
            {monthLabel || 'Month'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dobStyles.chip, dobStyles.chipNarrow, dobDay && dobStyles.chipFilled]}
          onPress={() => openSheet('day')}
          activeOpacity={0.75}
        >
          <Text style={dobDay ? dobStyles.chipValue : dobStyles.chipPlaceholder}>
            {dayLabel || 'Day'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[dobStyles.chip, dobYear && dobStyles.chipFilled]}
          onPress={() => openSheet('year')}
          activeOpacity={0.75}
        >
          <Text style={dobYear ? dobStyles.chipValue : dobStyles.chipPlaceholder}>
            {yearLabel || 'Year'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet — shared for whichever chip was tapped */}
      <Modal
        visible={openField !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpenField(null)}
      >
        <TouchableOpacity style={dobStyles.overlay} onPress={() => setOpenField(null)} activeOpacity={1}>
          <View style={dobStyles.sheet} onStartShouldSetResponder={() => true}>
            <View style={dobStyles.handle} />
            <Text style={dobStyles.sheetTitle}>{sheetTitle}</Text>
            <FlatList
              ref={listRef}
              data={sheetData}
              keyExtractor={item => item.value}
              style={dobStyles.sheetList}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({ length: DOB_SHEET_ITEM_H, offset: DOB_SHEET_ITEM_H * index, index })}
              renderItem={({ item }) => {
                const active = item.value === sheetValue;
                return (
                  <TouchableOpacity
                    style={[dobStyles.sheetItem, active && dobStyles.sheetItemActive]}
                    onPress={() => select(item.value)}
                    activeOpacity={0.65}
                  >
                    <Text style={[dobStyles.sheetItemText, active && dobStyles.sheetItemTextActive]}>
                      {item.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={17} color={Colors.brand} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const dobStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  chipWide:   { flex: 1.6 },
  chipNarrow: { flex: 0.8 },
  chipFilled: {
    borderColor: `${Colors.brand}50`,
    backgroundColor: Colors.surfaceElevated,
  },
  chipValue:       { flex: 1, fontSize: FontSize.label, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  chipPlaceholder: { flex: 1, fontSize: FontSize.label, color: Colors.textMuted },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '55%',
    paddingBottom: Spacing.xl,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginHorizontal: Spacing.base,
    marginBottom: 4,
  },
  sheetList: { maxHeight: 320 },
  sheetItem: {
    height: DOB_SHEET_ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  sheetItemActive: { backgroundColor: Colors.brandMuted },
  sheetItemText: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  sheetItemTextActive: {
    color: Colors.brand,
    fontWeight: FontWeight.semiBold,
  },
});

// ─── GuestNamePage ────────────────────────────────────────────────────────────

function GuestNamePage({
  onContinue,
  onBack,
}: {
  onContinue: (name: string, gender: string, dobMonth: string, dobDay: string, dobYear: string) => void;
  onBack: () => void;
}) {
  const [name,        setName]        = useState('');
  const [gender,      setGender]      = useState('');
  const [dobMonth,    setDobMonth]    = useState('');
  const [dobDay,      setDobDay]      = useState('');
  const [dobYear,     setDobYear]     = useState('');
  const [nameError,   setNameError]   = useState('');
  const [genderError, setGenderError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Letters, spaces, hyphens, apostrophes only (covers accented names like O'Brien, María)
  function handleNameChange(text: string) {
    setName(text.replace(/[^a-zA-ZÀ-ɏ'\- ]/g, ''));
    if (nameError) setNameError('');
  }

  function handleGenderSelect(value: string) {
    setGender(value);
    if (genderError) setGenderError('');
  }

  function handleContinue() {
    if (!name.trim()) {
      setNameError('Please enter your name to continue.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!gender) {
      setGenderError('Please select your gender to continue.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    onContinue(name, gender, dobMonth, dobDay, dobYear);
  }

  const GENDERS = [
    { value: 'male',   label: 'Male',   icon: 'man'   as const },
    { value: 'female', label: 'Female', icon: 'woman' as const },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={gnStyles.scroll}
        contentContainerStyle={gnStyles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onBack} style={aStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={gnStyles.iconCircle}>
          <Ionicons name="person" size={40} color={Colors.brand} />
        </View>

        <Text style={gnStyles.heading}>{"Tell us about\nyourself"}</Text>
        <Text style={gnStyles.sub}>Name and gender are required. Date of birth is optional.</Text>

        {/* Name — required */}
        <Text style={gnStyles.fieldLabel}>YOUR NAME <Text style={{ color: Colors.danger }}>*</Text></Text>
        <View style={[aStyles.inputWrap, nameError ? { borderColor: Colors.danger } : {}, { marginBottom: nameError ? Spacing.xs : Spacing.lg }]}>
          <Ionicons name="person-outline" size={18} color={nameError ? Colors.danger : Colors.textMuted} style={aStyles.inputIcon} />
          <TextInput
            style={aStyles.input}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Your name (required)"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={32}
            autoFocus
          />
        </View>
        {nameError ? (
          <View style={[aStyles.errorWrap, { marginBottom: Spacing.lg }]}>
            <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
            <Text style={aStyles.errorText}>{nameError}</Text>
          </View>
        ) : null}

        {/* Gender — required */}
        <Text style={gnStyles.fieldLabel}>GENDER <Text style={{ color: Colors.danger }}>*</Text></Text>
        <View style={[gnStyles.pillRow, genderError ? { marginBottom: Spacing.xs } : {}]}>
          {GENDERS.map(g => (
            <TouchableOpacity
              key={g.value}
              style={[gnStyles.pill, gender === g.value && gnStyles.pillActive, genderError && !gender ? { borderColor: Colors.danger } : {}]}
              onPress={() => handleGenderSelect(g.value)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={gender === g.value ? g.icon : (`${g.icon}-outline` as any)}
                size={16}
                color={gender === g.value ? Colors.brand : (genderError && !gender ? Colors.danger : Colors.textMuted)}
              />
              <Text style={[gnStyles.pillText, gender === g.value && gnStyles.pillTextActive, genderError && !gender ? { color: Colors.danger } : {}]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {genderError ? (
          <View style={[aStyles.errorWrap, { marginBottom: Spacing.lg }]}>
            <Ionicons name="alert-circle-outline" size={15} color={Colors.danger} />
            <Text style={aStyles.errorText}>{genderError}</Text>
          </View>
        ) : null}

        {/* Date of birth — three inline chips (Month / Day / Year) */}
        <Text style={[gnStyles.fieldLabel, { marginTop: Spacing.md }]}>DATE OF BIRTH <Text style={gnStyles.fieldLabelOptional}>(optional)</Text></Text>
        <DobPickerCombined
          dobMonth={dobMonth} dobDay={dobDay} dobYear={dobYear}
          onConfirm={(m, d, y) => { setDobMonth(m); setDobDay(d); setDobYear(y); }}
        />

        <TouchableOpacity
          style={[aStyles.submitBtn, { marginTop: Spacing.xl }]}
          onPress={handleContinue}
          activeOpacity={0.88}
        >
          <Text style={aStyles.submitText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const gnStyles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: Colors.background },
  content:    { padding: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.brandMuted,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, marginTop: Spacing.xl,
  },
  heading: {
    fontSize: 30, fontWeight: FontWeight.black, color: Colors.textPrimary,
    lineHeight: 38, marginBottom: Spacing.sm, letterSpacing: -0.5,
  },
  sub: {
    fontSize: FontSize.label, color: Colors.textMuted,
    lineHeight: 22, marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: FontSize.caption, fontWeight: FontWeight.semiBold,
    color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm,
  },
  fieldLabelOptional: {
    fontSize: FontSize.caption, fontWeight: FontWeight.regular,
    color: Colors.textDisabled, letterSpacing: 0.4,
  },

  // Gender pills
  pillRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  pill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.brandMuted,
    borderColor: Colors.brand,
  },
  pillText:       { fontSize: FontSize.label, fontWeight: FontWeight.medium, color: Colors.textMuted },
  pillTextActive: { color: Colors.brand, fontWeight: FontWeight.semiBold },

});

// ─── GuestPrefsPage ───────────────────────────────────────────────────────────

function GuestPrefsPage({
  onContinue,
  onBack,
}: {
  onContinue: (skill: string, hand: string, voiceGender: string, language: string) => void;
  onBack: () => void;
}) {
  const [skill,    setSkill]    = useState('intermediate');
  const [hand,     setHand]     = useState('right');
  const [voice,    setVoice]    = useState('male');
  const [language, setLanguage] = useState('en-US');

  const SKILLS = [
    { value: 'beginner',     label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced',     label: 'Advanced' },
    { value: 'elite',        label: 'Elite' },
  ];

  return (
    <ScrollView
      style={gpStyles.scroll}
      contentContainerStyle={gpStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={onBack} style={aStyles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Text style={gpStyles.heading}>Quick Setup</Text>
      <Text style={gpStyles.sub}>Personalises your first session. Takes 10 seconds.</Text>

      <Text style={gpStyles.sectionLabel}>SKILL LEVEL</Text>
      <View style={gpStyles.pillRow}>
        {SKILLS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[gpStyles.pill, skill === s.value && gpStyles.pillSel]}
            onPress={() => setSkill(s.value)}
            activeOpacity={0.75}
          >
            <Text style={[gpStyles.pillText, skill === s.value && gpStyles.pillTextSel]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={gpStyles.sectionLabel}>DOMINANT HAND</Text>
      <View style={gpStyles.pillRow}>
        {[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }].map((h) => (
          <TouchableOpacity
            key={h.value}
            style={[gpStyles.pill, gpStyles.pillHalf, hand === h.value && gpStyles.pillSel]}
            onPress={() => setHand(h.value)}
            activeOpacity={0.75}
          >
            <Text style={[gpStyles.pillText, hand === h.value && gpStyles.pillTextSel]}>{h.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={gpStyles.sectionLabel}>COACH VOICE</Text>
      <View style={gpStyles.pillRow}>
        {[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }].map((v) => (
          <TouchableOpacity
            key={v.value}
            style={[gpStyles.pill, gpStyles.pillHalf, voice === v.value && gpStyles.pillSel]}
            onPress={() => setVoice(v.value)}
            activeOpacity={0.75}
          >
            <Text style={[gpStyles.pillText, voice === v.value && gpStyles.pillTextSel]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={gpStyles.sectionLabel}>COACHING LANGUAGE</Text>
      <View style={gpStyles.langGrid}>
        {LANGUAGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[gpStyles.langChip, language === opt.value && gpStyles.langChipSel]}
            onPress={() => setLanguage(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[gpStyles.langChipText, language === opt.value && gpStyles.langChipTextSel]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={aStyles.submitBtn}
        onPress={() => onContinue(skill, hand, voice, language)}
        activeOpacity={0.88}
      >
        <Text style={aStyles.submitText}>Start Training</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const gpStyles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: Colors.background },
  content:  { padding: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  heading:  { fontSize: 30, fontWeight: FontWeight.black, color: Colors.textPrimary, lineHeight: 38, marginBottom: Spacing.sm, letterSpacing: -0.5, marginTop: Spacing.xl },
  sub:      { fontSize: FontSize.label, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: FontSize.micro, fontWeight: FontWeight.bold, color: Colors.textDisabled,
    letterSpacing: 1.3, marginBottom: Spacing.sm, marginTop: Spacing.lg,
  },
  pillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  pill:     {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillHalf: { flex: 1 },
  pillSel:  { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  pillText:    { fontSize: FontSize.label, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },
  pillTextSel: { color: Colors.brand, fontWeight: FontWeight.bold },

  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.base },
  langChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  langChipSel:     { borderColor: Colors.brand, backgroundColor: Colors.brandSoft },
  langChipText:    { fontSize: FontSize.caption, color: Colors.textMuted, fontWeight: FontWeight.medium },
  langChipTextSel: { color: Colors.brand, fontWeight: FontWeight.semiBold },
});
