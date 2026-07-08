import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { VoiceGender } from '../types';

export interface VoiceDisplayOption {
  id: string | undefined;
  name: string;
  quality: 'Auto' | 'Enhanced' | 'Compact';
}

// Looping near-silent clip that keeps the AVAudioSession continuously active.
// iOS suspends the JS thread (killing setTimeout/setInterval) during silent gaps between
// TTS cues unless audio is actively playing.
//
// CRITICAL: volume must be > 0. At volume=0 iOS treats the audio session as "muted"
// and suspends the process after its ~30-second grace period, killing all timers and
// voice calls. 0.001 is -60 dB — completely inaudible but iOS counts it as active audio.
//
// Re-created each session so there is no leak between sessions.
let bgLoopPlayer: AudioPlayer | null = null;

// iOS pitch fallback — used when no matching named voice is found.
// Male: 0.75 gives a noticeably deeper voice on the default iOS TTS engine.
// Android voices have different pitch response; 0.9/1.1 avoids over-processing artifacts.
const GENDER_PITCH: Record<VoiceGender, number> = Platform.OS === 'android'
  ? { male: 0.9, female: 1.1 }
  : { male: 0.75, female: 1.15 };

// iOS voice name keywords — ordered by coaching quality preference.
// Only used on iOS; Android uses identifier-pattern matching below.
const IOS_MALE_KEYWORDS   = ['aaron', 'alex', 'arthur', 'daniel', 'gordon', 'oliver', 'rishi', 'tom', 'fred', 'jorge', 'luca'];
const IOS_FEMALE_KEYWORDS = ['samantha', 'ava', 'allison', 'karen', 'moira', 'tessa', 'victoria', 'susan', 'sara', 'nicky', 'kate'];

// Android Google TTS voices use identifiers like "en-us-x-iom-network" (high quality,
// requires connectivity) or "en-us-x-tpf-local" (offline). We can't match by person
// name, so we rank by identifier patterns instead.
const ANDROID_PREFERRED_ID_PATTERNS = ['network', 'x-', 'premium', 'high'];

// Cached voices loaded once at session init
let cachedVoices: Speech.Voice[] = [];

/** Returns all voices installed on the device for the given language, sorted by quality.
 *  First entry is always the "Auto" option (id = undefined).
 *  Only returns results after initAudioSession() has been called (which populates the cache). */
export function getVoicesForDisplay(language: string): VoiceDisplayOption[] {
  const options: VoiceDisplayOption[] = [{ id: undefined, name: 'Auto (Recommended)', quality: 'Auto' }];
  if (cachedVoices.length === 0) return options;
  const langBase = language.split('-')[0].toLowerCase();
  let pool = cachedVoices.filter((v) => v.language.toLowerCase() === language.toLowerCase());
  if (pool.length === 0) {
    pool = cachedVoices.filter((v) => v.language.toLowerCase().startsWith(langBase));
  }
  const sorted = [...pool].sort((a, b) => {
    const qa = a.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
    const qb = b.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
    if (qa !== qb) return qa - qb;
    return a.name.localeCompare(b.name);
  });
  for (const v of sorted) {
    options.push({
      id: v.identifier,
      name: v.name,
      quality: v.quality === Speech.VoiceQuality.Enhanced ? 'Enhanced' : 'Compact',
    });
  }
  return options;
}

/** Pick best voice for the given language and gender.
 *  iOS: prefers Enhanced (neural) voices, matched by coach-friendly name keywords.
 *  Android: prefers Google network voices (highest quality available offline-optionally).
 *  Returns undefined → use system default + pitch fallback. */
function pickVoice(language: string, gender: VoiceGender, preferredId?: string): string | undefined {
  // User-selected voice takes priority if it's installed on this device
  if (preferredId) {
    const found = cachedVoices.find((v) => v.identifier === preferredId);
    if (found) return found.identifier;
  }
  if (cachedVoices.length === 0) return undefined;
  const langBase = language.split('-')[0].toLowerCase();

  // Build candidate pool — prefer exact locale match, fall back to language-base match
  let pool = cachedVoices.filter((v) => v.language.toLowerCase() === language.toLowerCase());
  if (pool.length === 0) {
    pool = cachedVoices.filter((v) => v.language.toLowerCase().startsWith(langBase));
  }
  if (pool.length === 0) return undefined;

  // ── Android: rank by identifier quality patterns, ignore person-name keywords ──
  if (Platform.OS === 'android') {
    // Try each quality pattern in priority order
    for (const pattern of ANDROID_PREFERRED_ID_PATTERNS) {
      const match = pool.find((v) => v.identifier.toLowerCase().includes(pattern));
      if (match) return match.identifier;
    }
    // Fall back to first voice in the language pool
    return pool[0]?.identifier;
  }

  // ── iOS: prefer Enhanced / Premium quality (Neural voices) ──────────────────
  // Sort pool: Premium > Enhanced > Default/Compact — so we always try the best
  // quality tier first regardless of name order.
  const QUALITY_RANK: Record<string, number> = {
    [Speech.VoiceQuality.Enhanced]: 2,
    Default: 0,
  };
  // expo-speech reports some voices as 'Default' which maps to Compact.
  // On iOS 17+ it can also report 'Enhanced' for neural voices.
  const sortedPool = [...pool].sort(
    (a, b) => (QUALITY_RANK[b.quality] ?? 0) - (QUALITY_RANK[a.quality] ?? 0),
  );
  const enhanced  = sortedPool.filter((v) => v.quality === Speech.VoiceQuality.Enhanced);
  const candidates = enhanced.length > 0 ? enhanced : sortedPool;

  const keywords = gender === 'male' ? IOS_MALE_KEYWORDS : IOS_FEMALE_KEYWORDS;

  // Try keyword match in Enhanced pool first, then fall back to full pool
  for (const kw of keywords) {
    const match = candidates.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match.identifier;
  }
  // Try full pool if Enhanced had no keyword match
  if (enhanced.length > 0) {
    for (const kw of keywords) {
      const match = sortedPool.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match.identifier;
    }
  }

  // No keyword-matched voice found — return undefined so iOS picks its own best
  // voice for the given language.
  //
  // WHY: returning candidates[0] (first compact voice, e.g. old "Alex") on iOS 17+
  // overrides Apple's built-in high-quality neural default with something worse.
  // With undefined, Speech.speak() uses the language parameter to let AVSpeechSynthesizer
  // choose the best installed voice for that locale — neural on iOS 17+, enhanced on
  // iOS 16 if downloaded, compact otherwise. Gender impression comes from pitch below.
  return undefined;
}

export async function initAudioSession(): Promise<void> {
  // Configure audio session for court training with expo-audio v1.x API:
  //   playsInSilentMode   → audible even when iOS silent/vibrate switch is on (critical for court use)
  //   allowsRecording     → false forces AVAudioSessionCategoryPlayback → routes to Bluetooth A2DP speaker
  //   interruptionMode    → 'duckOthers': TTS ducks background music rather than stopping it
  //   shouldPlayInBackground → keeps session timer alive during silent gaps when screen is locked
  //   shouldRouteThroughEarpiece → false: loudspeaker / Bluetooth, not earpiece
  try {
    await setIsAudioActiveAsync(true);
  } catch { /* non-critical */ }
  try {
    await setAudioModeAsync({
      playsInSilentMode:          true,
      allowsRecording:            false,
      interruptionMode:           'duckOthers',
      shouldPlayInBackground:     true,
      shouldRouteThroughEarpiece: false,
    });
  } catch { /* non-critical on web / simulator */ }

  // Load available voices once for gender/language selection
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices && voices.length > 0) cachedVoices = voices;
  } catch { /* voice list unavailable — will use pitch fallback */ }

  // Start the silent background loop AFTER the audio session is configured.
  if (bgLoopPlayer) {
    try { bgLoopPlayer.remove(); } catch {}
    bgLoopPlayer = null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    bgLoopPlayer = createAudioPlayer(require('../../assets/silent-loop.wav'));
    bgLoopPlayer.loop   = true;
    // 0.001 (-60 dB) keeps the AVAudioSession marked as "actively playing" by iOS.
    // Volume 0 causes iOS to suspend the JS thread after ~30 s; 0.001 prevents that.
    // The WAV file is silence, so this is completely inaudible at any volume.
    bgLoopPlayer.volume = 0.001;
    bgLoopPlayer.play();
  } catch { /* non-critical — session still works, just may be suspended in background */ }
}

/**
 * Interrupt any current speech and speak text immediately.
 * Selects an actual male/female system voice by name (Enhanced quality preferred).
 * Applies gender-specific rate factor for natural coaching tone.
 * Falls back to pitch adjustment if no named voice found.
 */
export function speakText(
  text: string,
  rate = 1.1,
  language = 'en-US',
  voiceGender: VoiceGender = 'female',
  preferredVoiceId?: string,
): void {
  // Re-assert the audio session is active (fast no-op if already active).
  // If it fails the session was lost (phone call, Siri) — full re-init to recover.
  setIsAudioActiveAsync(true).catch(() => {
    initAudioSession().catch(() => {});
  });
  try {
    Speech.stop();
    const voiceId = pickVoice(language, voiceGender, preferredVoiceId);
    // Court use: clamp between 0.7 (Bluetooth delay compensation) and 1.6 (max useful rate).
    const adjustedRate = Math.min(1.6, Math.max(0.7, rate));
    Speech.speak(text, {
      language,
      rate:   adjustedRate,
      // Neutral pitch when a named voice is selected; gender pitch only as fallback.
      pitch:  voiceId ? 1.0 : (GENDER_PITCH[voiceGender] ?? 1.0),
      volume: 1.0,
      // Critical for background audio: use our app's audio session (configured with
      // UIBackgroundModes:audio + shouldPlayInBackground) instead of iOS creating a
      // separate session that has no background entitlement.
      useApplicationAudioSession: true,
      ...(voiceId ? { voice: voiceId } : {}),
      onError: (e) => console.warn('[Audio] Speech.speak error:', e),
    });
  } catch (e) {
    console.warn('[Audio] speakText failed:', e);
  }
}

export function stopAudio(): void {
  try { Speech.stop(); } catch {}
}

// Re-assertion when returning to foreground after an interruption (phone call, Siri, lock screen).
// If the bgLoopPlayer was paused by a system interruption, resume it.
// If it was somehow destroyed (OS reclaim), recreate it so background audio continues
// for the remainder of the session without requiring a full initAudioSession().
export async function resumeAudioSession(): Promise<void> {
  try { await setIsAudioActiveAsync(true); } catch {}
  if (bgLoopPlayer) {
    try { if (!bgLoopPlayer.playing) bgLoopPlayer.play(); } catch {}
  } else {
    // Player was released by the OS during a long interruption — recreate it.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      bgLoopPlayer = createAudioPlayer(require('../../assets/silent-loop.wav'));
      bgLoopPlayer.loop   = true;
      bgLoopPlayer.volume = 0.001;
      bgLoopPlayer.play();
    } catch {}
  }
}

// Releases the audio session after a training session ends so the app no longer
// appears as "using audio" in iOS Control Center / Android notification shade.
// Call after the completion speech has finished (use a setTimeout delay if needed).
export async function teardownAudioSession(): Promise<void> {
  if (bgLoopPlayer) {
    try { bgLoopPlayer.pause(); } catch {}
    try { bgLoopPlayer.remove(); } catch {}
    bgLoopPlayer = null;
  }
  try { await setIsAudioActiveAsync(false); } catch {}
  try { await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }); } catch {}
}

