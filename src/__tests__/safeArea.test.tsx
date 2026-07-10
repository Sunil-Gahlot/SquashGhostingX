/**
 * SafeAreaProvider Enforcement Tests
 *
 * Verifies that every fullscreen/formSheet Modal in the app wraps its content
 * in SafeAreaProvider via the FullScreenModal component.
 *
 * WHY: React Native Modal creates a new native window root. SafeAreaProvider in
 * App.tsx does not propagate into Modals. Every Modal needs its own provider or
 * content overlaps the status bar / Dynamic Island on real devices.
 *
 * WHAT THESE CATCH: A developer adding a new Modal without using FullScreenModal,
 * or accidentally stripping SafeAreaProvider from an existing modal during a refactor.
 *
 * RUN: jest --testPathPattern=safeArea
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ── Mocks required for component rendering ────────────────────────────────────

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({ execAsync: jest.fn(), getAllAsync: jest.fn().mockResolvedValue([]) }),
  SQLiteProvider: ({ children }: any) => children,
}));
jest.mock('expo-speech', () => ({ VoiceQuality: { Enhanced: 1, Default: 0 }, speak: jest.fn(), stop: jest.fn(), getAvailableVoicesAsync: jest.fn().mockResolvedValue([]) }));
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn().mockReturnValue({ loop: false, volume: 1, play: jest.fn(), remove: jest.fn() }), setAudioModeAsync: jest.fn(), setIsAudioActiveAsync: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: jest.fn(), deactivateKeepAwake: jest.fn() }));
jest.mock('expo-brightness', () => ({ getBrightnessAsync: jest.fn().mockResolvedValue(1), setBrightnessAsync: jest.fn() }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), notificationAsync: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return { ...actual, useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) };
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function hasSafeAreaProvider(component: React.ReactElement): boolean {
  const { UNSAFE_getAllByType } = render(component);
  try {
    const providers = UNSAFE_getAllByType(SafeAreaProvider);
    return providers.length > 0;
  } catch {
    return false;
  }
}

// ─── FullScreenModal wrapper ──────────────────────────────────────────────────

describe('FullScreenModal', () => {
  const { FullScreenModal } = require('../components/FullScreenModal');
  const { SafeAreaView }    = require('react-native-safe-area-context');
  const { Text }            = require('react-native');

  test('wraps children in SafeAreaProvider', () => {
    const { UNSAFE_getAllByType } = render(
      <FullScreenModal visible>
        <SafeAreaView><Text>Content</Text></SafeAreaView>
      </FullScreenModal>
    );
    expect(UNSAFE_getAllByType(SafeAreaProvider).length).toBeGreaterThan(0);
  });

  test('passes props to underlying Modal (visible=false)', () => {
    const { queryByText } = render(
      <FullScreenModal visible={false}>
        <SafeAreaView><Text>Hidden</Text></SafeAreaView>
      </FullScreenModal>
    );
    // When visible=false, content is not rendered
    expect(queryByText('Hidden')).toBeNull();
  });
});

// ─── Per-modal SafeAreaProvider enforcement ───────────────────────────────────
// Each test renders the modal in its visible state and asserts SafeAreaProvider
// is present somewhere in the tree (via FullScreenModal).

describe('Modal SafeAreaProvider enforcement — all modals use FullScreenModal', () => {
  test('HelpModal contains SafeAreaProvider', () => {
    const HelpModal = require('../screens/HelpModal').default;
    const tree = <HelpModal visible onClose={jest.fn()} />;
    expect(hasSafeAreaProvider(tree)).toBe(true);
  });

  test('TermsConsentModal (viewOnly) contains SafeAreaProvider', () => {
    jest.mock('../stores/profileStore', () => ({
      useProfileStore: (sel: any) => sel({ profile: { hasAcceptedTerms: true }, hydratePii: jest.fn() }),
    }));
    const TermsConsentModal = require('../screens/TermsConsentModal').default;
    const tree = <TermsConsentModal viewOnly onClose={jest.fn()} />;
    expect(hasSafeAreaProvider(tree)).toBe(true);
  });

  test('TermsConsentModal (privacyOnly) contains SafeAreaProvider', () => {
    const TermsConsentModal = require('../screens/TermsConsentModal').default;
    const tree = <TermsConsentModal privacyOnly onClose={jest.fn()} />;
    expect(hasSafeAreaProvider(tree)).toBe(true);
  });
});
