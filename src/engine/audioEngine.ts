import * as Speech from 'expo-speech';
import { createAudioPlayer, type AudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { VoiceGender } from '../types';

// Looping near-silent clip that keeps the AVAudioSession continuously active.
// iOS suspends the JS thread (killing setTimeout/setInterval) during silent gaps between
// TTS cues unless audio is actively playing. Volume 0 = inaudible but the audio pipeline
// remains open, preventing thread suspension.
// Re-created each session so there is no leak between sessions.
let bgLoopPlayer: AudioPlayer | null = null;

// Pitch fallback — used when no matching named voice is found
// Male: 0.75 gives a noticeably deeper voice even on the default iOS TTS engine
const GENDER_PITCH: Record<VoiceGender, number> = {
  male:   0.75,
  female: 1.15,
};

// Voice name keywords (iOS: Alex/Aaron/Tom/Daniel = high-quality male; Samantha/Ava/Allison = female)
// Ordered by preference — first match wins
const MALE_VOICE_KEYWORDS   = ['aaron', 'alex', 'arthur', 'daniel', 'gordon', 'oliver', 'rishi', 'tom', 'fred', 'jorge', 'luca'];
const FEMALE_VOICE_KEYWORDS = ['samantha', 'ava', 'allison', 'karen', 'moira', 'tessa', 'victoria', 'susan', 'sara', 'nicky', 'kate'];

// Cached voices loaded once at session init
let cachedVoices: Speech.Voice[] = [];

/** Pick best voice for the given language and gender.
 *  Prefers Enhanced quality voices over Default/Compact quality.
 *  Returns undefined → use system default + pitch fallback. */
function pickVoice(language: string, gender: VoiceGender): string | undefined {
  if (cachedVoices.length === 0) return undefined;
  const langBase = language.split('-')[0].toLowerCase();

  // Build candidate pool — prefer exact locale match, fall back to language-base match
  let pool = cachedVoices.filter((v) => v.language.toLowerCase() === language.toLowerCase());
  if (pool.length === 0) {
    pool = cachedVoices.filter((v) => v.language.toLowerCase().startsWith(langBase));
  }
  if (pool.length === 0) return undefined;

  // Prefer Enhanced quality (Neural voices) — excludes Compact/Default which sound robotic
  const enhanced = pool.filter((v) => v.quality === Speech.VoiceQuality.Enhanced);
  const candidates = enhanced.length > 0 ? enhanced : pool;

  const keywords = gender === 'male' ? MALE_VOICE_KEYWORDS : FEMALE_VOICE_KEYWORDS;

  // Try keyword match in Enhanced pool first, then fall back to full pool
  for (const kw of keywords) {
    const match = candidates.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match.identifier;
  }
  // Try full pool if Enhanced had no keyword match
  if (enhanced.length > 0) {
    for (const kw of keywords) {
      const match = pool.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match.identifier;
    }
  }

  // No keyword match — return first available Enhanced (or any) voice for the language
  // so non-Latin-script languages (Arabic, Chinese, Japanese, Korean…) still use a
  // correct locale voice rather than falling back to the system default (often English).
  return candidates[0]?.identifier;
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
    bgLoopPlayer.volume = 0;
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
): void {
  // Re-assert the audio session is active (fast no-op if already active).
  // If it fails the session was lost (phone call, Siri) — full re-init to recover.
  setIsAudioActiveAsync(true).catch(() => {
    initAudioSession().catch(() => {});
  });
  try {
    Speech.stop();
    const voiceId = pickVoice(language, voiceGender);
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

// Lightweight re-assertion for returning to foreground after an interruption (phone call, Siri).
// Does NOT recreate the bgLoopPlayer — just re-activates the session and resumes the loop
// if iOS paused it during the interruption.
export async function resumeAudioSession(): Promise<void> {
  try { await setIsAudioActiveAsync(true); } catch {}
  if (bgLoopPlayer) {
    try { if (!bgLoopPlayer.playing) bgLoopPlayer.play(); } catch {}
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

