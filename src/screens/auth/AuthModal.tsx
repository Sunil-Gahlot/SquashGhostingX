import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Animated, Alert,
  ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/layout';
import { useProfileStore } from '../../stores/profileStore';

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
  const [idx, setIdx] = useState(0);
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const liftAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.5)).current;
  const bgGlowAnim = useRef(new Animated.Value(0.10)).current;
  const idxRef     = useRef(0);

  const slide = SLIDES[idx];
  const stats = SLIDE_STATS[idx];

  const advanceTo = useCallback((next: number) => {
    idxRef.current = next;
    Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIdx(next);
      liftAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(liftAnim, { toValue: 0, useNativeDriver: true, tension: 130, friction: 9 }),
      ]).start();
    });
  }, [fadeAnim, liftAnim]);

  useEffect(() => {
    const t = setInterval(() => {
      const next = (idxRef.current + 1) % SLIDES.length;
      idxRef.current = next;
      advanceTo(next);
    }, 4200);
    return () => clearInterval(t);
  }, [advanceTo]);

  useEffect(() => {
    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,   { toValue: 1.0, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim,   { toValue: 0.35, duration: 1800, useNativeDriver: false }),
      ])
    );
    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgGlowAnim, { toValue: 0.18, duration: 3200, useNativeDriver: false }),
        Animated.timing(bgGlowAnim, { toValue: 0.07, duration: 3200, useNativeDriver: false }),
      ])
    );
    iconLoop.start();
    bgLoop.start();
    return () => { iconLoop.stop(); bgLoop.stop(); };
  }, []);

  return (
    <View style={wStyles.container}>
      {/* Atmospheric background glow — renders first so it's behind everything */}
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
        <Text style={wStyles.brandName}>SquashGhostingX</Text>
      </View>

      {/* Main slide card — fills all available vertical space */}
      <Animated.View
        style={[
          wStyles.card,
          { borderTopColor: slide.color, opacity: fadeAnim, transform: [{ translateY: liftAnim }] },
        ]}
      >
        {/* Corner glow */}
        <Animated.View style={[wStyles.cardCornerGlow, { backgroundColor: slide.color, opacity: glowAnim }]} />

        {/* Label badge */}
        <View style={[wStyles.labelBadge, { backgroundColor: `${slide.color}18`, borderColor: `${slide.color}35` }]}>
          <Ionicons name={slide.icon} size={11} color={slide.color} />
          <Text style={[wStyles.slideLabel, { color: slide.color }]}>{slide.label}</Text>
        </View>

        {/* Icon */}
        <View style={[wStyles.iconCircle, { backgroundColor: `${slide.color}15` }]}>
          <Ionicons name={slide.icon} size={52} color={slide.color} />
        </View>

        {/* Text */}
        <Text style={wStyles.slideTitle}>{slide.title}</Text>
        <Text style={wStyles.slideSub}>{slide.sub}</Text>

        {/* Stats row */}
        <View style={wStyles.statsRow}>
          {stats.map((stat, i) => (
            <React.Fragment key={stat}>
              <Text style={wStyles.statText}>{stat}</Text>
              {i < stats.length - 1 && <View style={wStyles.statDot} />}
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* Pagination dots */}
      <View style={wStyles.dots}>
        {SLIDES.map((s, i) => (
          <TouchableOpacity key={s.id} onPress={() => advanceTo(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Animated.View style={[
              wStyles.dot,
              i === idx && { width: 28, backgroundColor: slide.color },
            ]} />
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

      <TouchableOpacity style={wStyles.guestRow} onPress={onGuest} activeOpacity={0.7}>
        <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
        <Text style={wStyles.guestRowText}>Continue as Guest</Text>
        <Ionicons name="chevron-forward" size={11} color={Colors.textMuted} />
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
  // Main slide card — no maxHeight, fills all available space
  card: {
    flex: 1,
    width: '100%',
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
    marginBottom: Spacing.lg,
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

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  guestRowText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
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
      `Reset the password for ${trimmedEmail}?\n\nThis will clear your saved credentials on this device. You can then create a new password.`,
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
  const { profile, hasCompletedAuth, completeAuth, completeOnboarding, setProfile } = useProfileStore();

  const [page, setPage] = useState<'welcome' | 'register' | 'login'>('welcome');

  if (hasCompletedAuth) return null;

  function handleAuthComplete(email?: string) {
    const isGuest = !email;
    if (email && !profile.name) {
      setProfile({ name: email.split('@')[0] });
    }
    completeAuth(email);
    if (isGuest) {
      completeOnboarding();
    }
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
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
});
