import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';
import { VoiceGender } from '../types';

// Rotating recovery cues — natural coach-like calls, no abrupt "T!" shortcut
const RECOVERY_CUES = ['Back to T!', 'Recover to T!', 'Back to the T!'];

const COACHING_PHRASES = [
  'Great work, keep going',
  'Stay focused, push through',
  'Good movement, keep the pace',
  "You're doing great",
  'Stay low and fast',
  'Excellent work, keep it up',
  'Push harder, you can do it',
  'Nice footwork, stay sharp',
  'Keep your energy up',
  'Almost there, stay strong',
];

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
 *  Prefers Enhanced quality voices over Default quality.
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

  // Prefer Enhanced quality only (not Compact — Compact can sound robotic)
  const enhanced = pool.filter((v) => (v as any).quality === 'Enhanced');
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
  // Configure audio session for court training:
  //   iOS: playsInSilentModeIOS  → audible even on silent/vibrate ring switch.
  //        allowsRecordingIOS=false → forces AVAudioSessionCategoryPlayback so iOS
  //          routes speech to Bluetooth A2DP speakers (not the earpiece).
  //        interruptionModeIOS=1 (DoNotMix) → our audio takes priority; other apps duck.
  //        staysActiveInBackground → keeps session alive so BT audio route persists
  //          even when screen dims between calls.
  //   Android: playThroughEarpieceAndroid=false → routes to loudspeaker, not earpiece,
  //          so audio is audible when phone is placed outside the court.
  //        shouldDuckAndroid=false → prevent Android from lowering our volume.
  try {
    await setAudioModeAsync({
      playsInSilentModeIOS:        true,
      shouldPlayInBackground:      true,
      staysActiveInBackground:     true,
      allowsRecordingIOS:          false,  // forces playback category → Bluetooth A2DP
      interruptionModeIOS:         1,      // DoNotMix — our audio owns the session
      playThroughEarpieceAndroid:  false,  // loudspeaker, not earpiece
      shouldDuckAndroid:           false,
    } as any);
  } catch { /* non-critical on web / simulator */ }

  // Load available voices once for gender/language selection
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices && voices.length > 0) cachedVoices = voices;
  } catch { /* voice list unavailable — will use pitch fallback */ }
}

/**
 * Interrupt any current speech and speak text immediately.
 * Selects an actual male/female system voice by name (Enhanced quality preferred).
 * Applies gender-specific rate factor for natural coaching tone.
 * Falls back to pitch adjustment if no named voice found.
 */
export function speakText(
  text: string,
  rate = 0.9,
  language = 'en-US',
  voiceGender: VoiceGender = 'female',
): void {
  try {
    Speech.stop();
    const voiceId = pickVoice(language, voiceGender);
    const adjustedRate = Math.min(1.5, Math.max(0.5, rate));
    // Don't include `voice` when undefined — passing it explicitly as undefined
    // can cause silent failures on some platform/TTS combinations.
    Speech.speak(text, {
      language,
      rate:   adjustedRate,
      pitch:  voiceId ? 1.0 : (GENDER_PITCH[voiceGender] ?? 1.0),
      volume: 1.0,
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

/** Returns rotated recovery cue: "recover to T" → "back to T" → "return to T" */
export function getRecoveryCue(callIndex: number): string {
  return RECOVERY_CUES[callIndex % RECOVERY_CUES.length];
}

/** Returns rotating mid-session coaching encouragement. */
export function getCoachingPhrase(callIndex: number): string {
  return COACHING_PHRASES[callIndex % COACHING_PHRASES.length];
}
