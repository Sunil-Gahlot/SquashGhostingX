/**
 * Audio Engine — Voice Selection Tests
 *
 * Tests the curated voice selection logic in getVoicesForDisplay() and pickVoice()
 * (pickVoice is not exported, tested indirectly via getVoicesForDisplay ordering).
 *
 * expo-speech is mocked so these run in Node.js with no device needed.
 * loadVoicesIfNeeded / isVoiceInstalled are tested with the mock cache.
 */

import { Platform } from 'react-native';

// ── Mock expo-speech ──────────────────────────────────────────────────────────
// Factory must NOT reference module-scope variables (hoisting order is unreliable).
// Return value is set explicitly in seedVoiceCache() before each test that needs it.
jest.mock('expo-speech', () => ({
  VoiceQuality: { Enhanced: 1, Default: 0 },
  getAvailableVoicesAsync: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer:     jest.fn().mockReturnValue({ loop: false, volume: 1, play: jest.fn(), remove: jest.fn() }),
  setAudioModeAsync:     jest.fn().mockResolvedValue(undefined),
  setIsAudioActiveAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as Audio from '../engine/audioEngine';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_VOICES = [
  // iOS English — male curated
  { identifier: 'com.apple.ttsbundle.Tom-premium',      name: 'Tom',      language: 'en-US', quality: 1 },
  { identifier: 'com.apple.ttsbundle.Aaron-premium',    name: 'Aaron',    language: 'en-US', quality: 1 },
  { identifier: 'com.apple.ttsbundle.Daniel-compact',   name: 'Daniel',   language: 'en-US', quality: 0 },
  // iOS English — female curated
  { identifier: 'com.apple.ttsbundle.Samantha-premium', name: 'Samantha', language: 'en-US', quality: 1 },
  { identifier: 'com.apple.ttsbundle.Ava-premium',      name: 'Ava',      language: 'en-US', quality: 1 },
  { identifier: 'com.apple.ttsbundle.Kate-compact',     name: 'Kate',     language: 'en-US', quality: 0 },
  // iOS English — non-curated (should NOT appear in picker)
  { identifier: 'com.apple.ttsbundle.Alex-compact',     name: 'Alex',     language: 'en-US', quality: 0 },
  { identifier: 'com.apple.ttsbundle.Fred-compact',     name: 'Fred',     language: 'en-US', quality: 0 },
  // French — Enhanced only
  { identifier: 'com.apple.ttsbundle.Marie-premium',    name: 'Marie',    language: 'fr-FR', quality: 1 },
  { identifier: 'com.apple.ttsbundle.Thomas-compact',   name: 'Thomas',   language: 'fr-FR', quality: 0 },
  // Android
  { identifier: 'en-us-x-iom-network', name: 'en-us-x-iom-network', language: 'en-US', quality: 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Sets the mock return value then loads the voice cache. Called in beforeEach so it
// works regardless of whether jest resets mock implementations or module state.
async function seedVoiceCache() {
  const Speech = require('expo-speech');
  Speech.getAvailableVoicesAsync.mockResolvedValue(MOCK_VOICES);
  await Audio.loadVoicesIfNeeded();
}

// ─── getVoicesForDisplay ──────────────────────────────────────────────────────

describe('getVoicesForDisplay — iOS English', () => {
  beforeEach(seedVoiceCache);

  test('first entry is always Auto (Recommended) with id=undefined', () => {
    const opts = Audio.getVoicesForDisplay('en-US', 'male');
    expect(opts[0]).toEqual({ id: undefined, name: 'Auto (Recommended)', quality: 'Auto' });
  });

  test('male: Tom appears before Aaron', () => {
    const opts  = Audio.getVoicesForDisplay('en-US', 'male');
    const names = opts.map((o) => o.name);
    expect(names.indexOf('Tom')).toBeGreaterThan(0);
    expect(names.indexOf('Tom')).toBeLessThan(names.indexOf('Aaron'));
  });

  test('female: Samantha appears before Ava', () => {
    const opts  = Audio.getVoicesForDisplay('en-US', 'female');
    const names = opts.map((o) => o.name);
    expect(names.indexOf('Samantha')).toBeGreaterThan(0);
    expect(names.indexOf('Samantha')).toBeLessThan(names.indexOf('Ava'));
  });

  test('male picker does NOT include female curated names (Samantha, Ava)', () => {
    const opts  = Audio.getVoicesForDisplay('en-US', 'male');
    const names = opts.map((o) => o.name.toLowerCase());
    expect(names).not.toContain('samantha');
    expect(names).not.toContain('ava');
  });

  test('female picker does NOT include male curated names (Tom, Aaron)', () => {
    const opts  = Audio.getVoicesForDisplay('en-US', 'female');
    const names = opts.map((o) => o.name.toLowerCase());
    expect(names).not.toContain('tom');
    expect(names).not.toContain('aaron');
  });

  test('non-curated voices (Alex, Fred) do NOT appear in picker', () => {
    const optsM   = Audio.getVoicesForDisplay('en-US', 'male');
    const optsF   = Audio.getVoicesForDisplay('en-US', 'female');
    const allNames = [...optsM, ...optsF].map((o) => o.name.toLowerCase());
    expect(allNames).not.toContain('alex');
    expect(allNames).not.toContain('fred');
  });

  test('Enhanced voices appear before Standard in the list', () => {
    const opts            = Audio.getVoicesForDisplay('en-US', 'male').filter((o) => o.id !== undefined);
    const firstStandardIdx = opts.findIndex((o) => o.quality === 'Standard');
    const lastEnhancedIdx  = opts.reduce((last, o, i) => (o.quality === 'Enhanced' ? i : last), -1);
    if (firstStandardIdx !== -1 && lastEnhancedIdx !== -1) {
      expect(lastEnhancedIdx).toBeLessThan(firstStandardIdx);
    }
  });
});

describe('getVoicesForDisplay — iOS French', () => {
  beforeEach(seedVoiceCache);

  test('only Enhanced voices appear for non-English language', () => {
    const opts    = Audio.getVoicesForDisplay('fr-FR', 'female');
    const nonAuto = opts.filter((o) => o.id !== undefined);
    expect(nonAuto.every((o) => o.quality === 'Enhanced')).toBe(true);
  });

  test('non-Enhanced French voices do NOT appear', () => {
    const opts  = Audio.getVoicesForDisplay('fr-FR', 'female');
    const names = opts.map((o) => o.name);
    expect(names).not.toContain('Thomas'); // compact voice
  });
});

describe('getVoicesForDisplay — Android', () => {
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  test('returns only Auto (Recommended) on Android', () => {
    const opts = Audio.getVoicesForDisplay('en-US', 'male');
    expect(opts).toHaveLength(1);
    expect(opts[0]).toEqual({ id: undefined, name: 'Auto (Recommended)', quality: 'Auto' });
  });
});

// ─── isVoiceInstalled ─────────────────────────────────────────────────────────

describe('isVoiceInstalled', () => {
  beforeEach(seedVoiceCache);

  test('returns true for a voice in the mock cache', () => {
    expect(Audio.isVoiceInstalled('com.apple.ttsbundle.Tom-premium')).toBe(true);
  });

  test('returns false for a voice not in the cache', () => {
    expect(Audio.isVoiceInstalled('com.apple.ttsbundle.NONEXISTENT-premium')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(Audio.isVoiceInstalled('')).toBe(false);
  });
});

// ─── loadVoicesIfNeeded ───────────────────────────────────────────────────────

describe('loadVoicesIfNeeded', () => {
  beforeEach(() => {
    const Speech = require('expo-speech');
    Speech.getAvailableVoicesAsync.mockResolvedValue(MOCK_VOICES);
  });

  test('resolves without throwing', async () => {
    await expect(Audio.loadVoicesIfNeeded()).resolves.toBeUndefined();
  });

  test('second call is a no-op (idempotent — does not re-fetch voices)', async () => {
    const Speech = require('expo-speech');
    // First call: either loads from network (cache empty) or is a no-op (already populated).
    await Audio.loadVoicesIfNeeded();
    const callsAfterFirst = Speech.getAvailableVoicesAsync.mock.calls.length;
    // Second call must NEVER call getAvailableVoicesAsync again — cache is now populated.
    await Audio.loadVoicesIfNeeded();
    expect(Speech.getAvailableVoicesAsync.mock.calls.length).toBe(callsAfterFirst);
  });
});
