import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { VoiceGender } from '../types';

export interface VoiceDisplayOption {
  id: string | undefined;
  name: string;
  quality: 'Auto' | 'Enhanced' | 'Standard';
}

// Looping sub-sonic tone that keeps the AVAudioSession continuously active.
//
// WHY a tone instead of silence: iOS 17+ audio power management detects zero-amplitude
// output and can suspend the audio subsystem even while UIBackgroundModes["audio"] is set.
// The file is a 16 Hz sine wave (below human hearing) at 0.61% amplitude — completely
// inaudible but guarantees non-zero audio output that iOS counts as "actively playing."
//
// WHY volume 0.01: 1% of an already 0.61%-amplitude source = effectively inaudible.
// We use a non-zero volume so that iOS's audio session health-check sees a live audio
// stream at every layer (source + mixer + output). Volume 0 would defeat the purpose.
//
// Re-created each session so there is no resource leak between sessions.
let bgLoopPlayer: AudioPlayer | null = null;

// iOS pitch fallback — used when no matching named voice is found.
// Male: 0.75 gives a noticeably deeper voice on the default iOS TTS engine.
// Android voices have different pitch response; 0.9/1.1 avoids over-processing artifacts.
const GENDER_PITCH: Record<VoiceGender, number> = Platform.OS === 'android'
  ? { male: 0.9, female: 1.1 }
  : { male: 0.75, female: 1.15 };

// ─── Curated voice lists ──────────────────────────────────────────────────────
//
// Only a hand-tested subset of iOS voices is exposed to users. Every voice on this
// list sounds clear, energetic, and professional for sports coaching. Voices are
// ordered best-first so auto-selection picks the highest-quality available name.
//
// Tom and Samantha are the proven gold-standard coaching voices on iOS — energetic,
// clear pronunciation, natural pacing. Ava (neural) is the best overall quality
// voice but is ranked second for female because Samantha's pacing suits coaching better.
//
// Non-English languages: only Enhanced (neural) voices qualify — they are all
// natural-sounding and don't require a per-language curated list.
const CURATED_EN: Record<VoiceGender, string[]> = {
  male:   ['tom', 'aaron', 'arthur', 'daniel', 'gordon', 'oliver', 'rishi'],
  female: ['samantha', 'ava', 'nicky', 'allison', 'kate', 'karen', 'moira', 'victoria'],
};

// Android Google TTS voices use identifiers like "en-us-x-iom-network" (network quality)
// or "en-us-x-tpf-local" (offline). Person-name matching is not possible; we rank by
// identifier patterns instead. Android voice names are not human-readable so the picker
// only shows "Auto (Recommended)" on Android.
const ANDROID_PREFERRED_ID_PATTERNS = ['network', 'x-', 'premium', 'high'];

// Cached voices loaded once at session init
let cachedVoices: Speech.Voice[] = [];

/** Explicitly load the voice cache if it hasn't been populated yet.
 *  initAudioSession() loads voices non-blocking, so this is needed when the
 *  voice picker is opened before a session has started (or immediately after app launch). */
export async function loadVoicesIfNeeded(): Promise<void> {
  if (cachedVoices.length > 0) return;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (voices && voices.length > 0) cachedVoices = voices;
  } catch { /* voice list unavailable — picker falls back to Auto */ }
}

/** Returns true if the given voice identifier is present on this device.
 *  Used to detect stale preferredVoiceId (set on a different device or after
 *  a voice was deleted from iOS Settings → Spoken Content → Voices). */
export function isVoiceInstalled(voiceId: string): boolean {
  return cachedVoices.some((v) => v.identifier === voiceId);
}

/**
 * Synchronous heartbeat: re-assert the background loop player is playing.
 * Called every second from the session timer so iOS continuously sees non-zero audio
 * output between TTS position calls and never suspends the audio subsystem during
 * silent gaps — even on devices with aggressive iOS 17+ audio power management.
 * Also called at the top of speakText() so every voice instruction fires with a
 * confirmed-active audio stream behind it.
 * No-op if bgLoopPlayer is null (session not started yet).
 */
export function assertBgLoop(): void {
  if (bgLoopPlayer) {
    try { bgLoopPlayer.play(); } catch {}
  }
}

/** Returns the curated voice list for the picker UI.
 *  English: only the hand-tested curated voices, Enhanced tier first, in coaching-quality order.
 *  When gender is omitted, both female and male voices are returned (female first).
 *  Non-English: Enhanced (neural) voices only — sorted alphabetically.
 *  Android: returns only "Auto (Recommended)" — Android voice identifiers are not human-readable.
 *  First entry is always "Auto (Recommended)" (id = undefined).
 *  Requires initAudioSession() to have been called first to populate the cache. */
export function getVoicesForDisplay(language: string, gender?: VoiceGender): VoiceDisplayOption[] {
  const options: VoiceDisplayOption[] = [{ id: undefined, name: 'Auto (Recommended)', quality: 'Auto' }];
  // Android voice identifiers are machine names (e.g. "en-us-x-iom-network") — not suitable
  // for display. Auto-selection always picks the best available Google TTS voice.
  if (Platform.OS === 'android') return options;
  if (cachedVoices.length === 0) return options;

  const langBase = language.split('-')[0].toLowerCase();
  let pool = cachedVoices.filter((v) => v.language.toLowerCase() === language.toLowerCase());
  if (pool.length === 0) {
    pool = cachedVoices.filter((v) => v.language.toLowerCase().startsWith(langBase));
  }

  if (langBase === 'en') {
    // English: expose only curated voices, Enhanced tier before Standard, in priority order.
    // When gender is not specified, show both female and male voices (female first) so the
    // picker gives the user full choice without requiring a profile gender setting.
    const genders: VoiceGender[] = gender ? [gender] : ['female', 'male'];
    const added = new Set<string>();
    for (const g of genders) {
      const names = CURATED_EN[g];
      for (const wantEnhanced of [true, false]) {
        for (const name of names) {
          const voice = pool.find(
            (v) =>
              v.name.toLowerCase().includes(name) &&
              (wantEnhanced
                ? v.quality === Speech.VoiceQuality.Enhanced
                : v.quality !== Speech.VoiceQuality.Enhanced) &&
              !added.has(v.identifier),
          );
          if (voice) {
            added.add(voice.identifier);
            options.push({
              id:      voice.identifier,
              name:    voice.name,
              quality: wantEnhanced ? 'Enhanced' : 'Standard',
            });
          }
        }
      }
    }
  } else {
    // Non-English: Enhanced (neural) voices only — all are coaching-quality
    const enhanced = pool
      .filter((v) => v.quality === Speech.VoiceQuality.Enhanced)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const v of enhanced) {
      options.push({ id: v.identifier, name: v.name, quality: 'Enhanced' });
    }
  }

  return options;
}

/** Speak a preview phrase with a specific voice for the voice picker UI.
 *  Bypasses auto-selection — uses exactly the provided voiceId (undefined = system default).
 *  Does not update the persisted preference.
 *  Configures the audio session before speaking so the preview works even when
 *  no session has been started (e.g. user opens voice picker before training). */
export async function previewVoice(
  phrase: string,
  voiceId: string | undefined,
  language: string,
  rate: number,
  gender: VoiceGender,
): Promise<void> {
  // Configure audio session so TTS is audible even with the silent switch on.
  // Without this, Speech.speak with useApplicationAudioSession:true uses a default
  // unconfigured session and iOS blocks audio when the silent switch is engaged.
  try {
    await setAudioModeAsync({
      playsInSilentMode:          true,
      allowsRecording:            false,
      interruptionMode:           'duckOthers',
      shouldPlayInBackground:     false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {}
  setIsAudioActiveAsync(true).catch(() => {});
  try {
    Speech.stop();
    const adjustedRate = Math.min(1.6, Math.max(0.7, rate));
    Speech.speak(phrase, {
      language,
      rate:   adjustedRate,
      pitch:  voiceId ? 1.0 : (GENDER_PITCH[gender] ?? 1.0),
      volume: 1.0,
      useApplicationAudioSession: true,
      ...(voiceId ? { voice: voiceId } : {}),
      onError: () => {},
    });
  } catch {}
}

/** Pick best voice for the given language and gender.
 *  iOS: prefers Enhanced (neural) voices, matched by coach-friendly name keywords.
 *  Android: prefers Google network voices (highest quality available offline-optionally).
 *  Returns undefined → use system default + pitch fallback. */
function pickVoice(language: string, gender: VoiceGender, preferredId?: string): string | undefined {
  // User-selected voice takes priority.
  if (preferredId) {
    // When cachedVoices is empty (voices not yet loaded from initAudioSession), trust the
    // stored preference directly — it was validated against the installed voice list when
    // the user selected it, so it is safe to use without re-checking the cache.
    if (cachedVoices.length === 0) return preferredId;
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

  // ── iOS English: walk curated list, Enhanced tier first then Standard ────────
  if (langBase === 'en') {
    const names = CURATED_EN[gender];
    for (const wantEnhanced of [true, false]) {
      for (const name of names) {
        const match = pool.find(
          (v) =>
            v.name.toLowerCase().includes(name) &&
            (wantEnhanced
              ? v.quality === Speech.VoiceQuality.Enhanced
              : v.quality !== Speech.VoiceQuality.Enhanced),
        );
        if (match) return match.identifier;
      }
    }
    // None of the curated names are installed — let iOS choose its own best neural voice.
    // WHY undefined: returning pool[0] (e.g. old "Alex") on iOS 17+ overrides Apple's
    // built-in neural default with something worse. undefined → AVSpeechSynthesizer picks
    // the best installed voice for the locale. Gender impression comes from GENDER_PITCH.
    return undefined;
  }

  // ── iOS non-English: first Enhanced (neural) voice found ────────────────────
  const enhanced = pool.filter((v) => v.quality === Speech.VoiceQuality.Enhanced);
  if (enhanced.length > 0) return enhanced[0].identifier;

  // No Enhanced voice for this locale — let OS pick rather than forcing a compact voice.
  return undefined;
}

// iOS MPNowPlayingInfoCenter — populate media transport controls so iOS 17.4+
// background audio policy does not flag the app as using audio without media intent.
// Apple may require this for App Store approval if background audio is rejected.
// Implementation requires a native module; uncomment and wire up if submission is rejected.
//
// import { NativeModules } from 'react-native';
// function setNowPlayingInfo(title: string) {
//   if (Platform.OS !== 'ios') return;
//   try {
//     NativeModules.RCTNowPlayingInfoCenter?.setNowPlaying({
//       title,
//       artist: 'Squash GhostingX',
//       isLiveStream: false,
//     });
//   } catch {}
// }
// export function clearNowPlayingInfo() {
//   if (Platform.OS !== 'ios') return;
//   try { NativeModules.RCTNowPlayingInfoCenter?.clearNowPlaying(); } catch {}
// }

export async function initAudioSession(): Promise<void> {
  // Configure audio session for court training with expo-audio v1.x API:
  //   playsInSilentMode   → audible even when iOS silent/vibrate switch is on (critical for court use)
  //   allowsRecording     → false forces AVAudioSessionCategoryPlayback → routes to Bluetooth A2DP speaker
  //   interruptionMode    → 'duckOthers': TTS ducks background music rather than stopping it
  //   shouldPlayInBackground → keeps session timer alive during silent gaps when screen is locked
  //   shouldRouteThroughEarpiece → false: loudspeaker / Bluetooth, not earpiece
  //
  // ORDER IS CRITICAL: configure the mode BEFORE activating the session.
  // setIsAudioActiveAsync BEFORE setAudioModeAsync means iOS activates the session with
  // default settings (no background, no silent-mode play) before we apply our requirements.
  // iOS ignores session category changes made after activation on some versions.
  try {
    await setAudioModeAsync({
      playsInSilentMode:          true,
      allowsRecording:            false,
      interruptionMode:           'duckOthers',
      shouldPlayInBackground:     true,
      shouldRouteThroughEarpiece: false,
    });
  } catch { /* non-critical on web / simulator */ }
  try {
    await setIsAudioActiveAsync(true);
  } catch { /* non-critical */ }

  // Start the background loop IMMEDIATELY — before voice loading so the audio session
  // is confirmed active and the player is running before any potential screen lock.
  // Voice loading is deferred (non-blocking) so it never delays player start.
  if (bgLoopPlayer) {
    try { bgLoopPlayer.remove(); } catch {}
    bgLoopPlayer = null;
  }
  try {
    // keepAudioSessionActive: true — critical iOS option that prevents expo-audio from
    // automatically deactivating the AVAudioSession at the end of each loop cycle.
    // Without it, there is a brief dead window (a few ms) between each 181 ms WAV loop
    // restart where iOS sees no active audio output and is eligible to suspend the app —
    // even with UIBackgroundModes:audio present in the binary.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    bgLoopPlayer = createAudioPlayer(
      require('../../assets/silent-loop.wav'),
      { keepAudioSessionActive: true },
    );
    bgLoopPlayer.loop   = true;
    // Volume 1.0: the WAV is a 200 Hz sine at 0.61% amplitude — completely inaudible
    // through phone speakers (hardware HPF cutoff ~300 Hz). At full volume, iOS CoreAudio
    // sees clearly non-zero PCM samples and keeps the audio session — and with it the
    // JS thread and all timers — alive in background.
    bgLoopPlayer.volume = 1.0;
    bgLoopPlayer.play();
  } catch { /* non-critical — session still works, just may be suspended in background */ }

  // Load voices before returning so the correct voice is used from the very first TTS call.
  // On a real device getAvailableVoicesAsync() completes in < 50 ms; awaiting it here
  // costs negligible time vs. the 2.5-second countdown buffer after initAudioSession().
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
  rate = 1.1,
  language = 'en-US',
  voiceGender: VoiceGender = 'female',
  preferredVoiceId?: string,
): void {
  // Re-assert the audio session is active (fast no-op if already active).
  // On failure use resumeAudioSession (NOT initAudioSession) — initAudioSession destroys
  // and recreates bgLoopPlayer, creating a brief silence gap that iOS can use to suspend.
  setIsAudioActiveAsync(true).catch(() => {
    resumeAudioSession().catch(() => {});
  });
  // Sync heartbeat: re-assert bgLoopPlayer is playing BEFORE TTS starts so iOS sees
  // active non-zero audio output at the exact moment this voice call begins.
  assertBgLoop();
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
      // Re-assert the audio session the moment TTS finishes. AVSpeechSynthesizer can
      // deactivate the shared AVAudioSession when the utterance ends, which briefly
      // removes the "active audio output" that iOS uses to keep the app alive in
      // background. Without this, a power-button lock in the gap between TTS calls
      // would suspend the JS thread even though bgLoopPlayer is looping.
      onDone: () => {
        assertBgLoop();
        setIsAudioActiveAsync(true).catch(() => {});
      },
      onError: (e) => {
        if (__DEV__) console.warn('[Audio] Speech.speak error:', e);
        assertBgLoop();
      },
    });
  } catch (e) {
    if (__DEV__) console.warn('[Audio] speakText failed:', e);
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
  // CRITICAL: play() BEFORE setIsAudioActiveAsync.
  // iOS checks for active audio output at the instant of AppState → background transition.
  // setIsAudioActiveAsync is a bridge call with ~20–50 ms latency; if we await it first,
  // bgLoopPlayer.play() fires after iOS has already evaluated whether to suspend the app.
  // Calling play() synchronously first ensures the audio stream is asserted immediately.
  if (bgLoopPlayer) {
    // Always call play() — do NOT check .playing first.
    // After iOS suspends the audio subsystem, .playing may return true while the
    // underlying stream is actually frozen. Unconditional play() re-asserts the stream.
    try { bgLoopPlayer.play(); } catch {}
  } else {
    // Player was released by the OS during a long interruption — recreate it.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      bgLoopPlayer = createAudioPlayer(
        require('../../assets/silent-loop.wav'),
        { keepAudioSessionActive: true },
      );
      bgLoopPlayer.loop   = true;
      bgLoopPlayer.volume = 1.0;
      bgLoopPlayer.play();
    } catch {}
  }
  try { await setIsAudioActiveAsync(true); } catch {}
}

/**
 * Full audio session restore — called when returning to foreground (AppState → 'active').
 * Unlike resumeAudioSession() which is optimised for the narrow background-transition window,
 * this re-applies setAudioModeAsync first because phone calls and Siri interruptions reset
 * the iOS audio session category, stripping our shouldPlayInBackground + playsInSilentMode
 * settings. Without this, the next screen lock after a phone call would suspend the JS thread
 * because iOS no longer knows the app is entitled to background audio.
 */
export async function restoreAudioSession(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode:          true,
      allowsRecording:            false,
      interruptionMode:           'duckOthers',
      shouldPlayInBackground:     true,
      shouldRouteThroughEarpiece: false,
    });
  } catch {}
  if (bgLoopPlayer) {
    try { bgLoopPlayer.play(); } catch {}
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      bgLoopPlayer = createAudioPlayer(
        require('../../assets/silent-loop.wav'),
        { keepAudioSessionActive: true },
      );
      bgLoopPlayer.loop   = true;
      bgLoopPlayer.volume = 1.0;
      bgLoopPlayer.play();
    } catch {}
  }
  try { await setIsAudioActiveAsync(true); } catch {}
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

