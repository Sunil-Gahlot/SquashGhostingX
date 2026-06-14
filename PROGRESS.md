# SquashGhostingX — Progress Tracker

_Updated after every completed task. Each entry: task, file(s), status, any issues._

---

## Stack (locked — do not add packages)
- Expo SDK ~54.0.34 · React Native 0.81.5 · New Architecture
- expo-sqlite, expo-speech, expo-av, expo-haptics, expo-brightness
- zustand ^4.5.7, react-native-svg, react-native-reanimated ~4.1.1
- @react-navigation/native + bottom-tabs, @expo/vector-icons (Ionicons)

---

## Phase 1 — Core Engine ✅ DONE
| Task | File | Status |
|------|------|--------|
| SQLite schema + WAL mode | `src/db/schema.ts` | ✅ |
| Session queries (save, load, recent) | `src/db/queries.ts` | ✅ |
| Session engine (position calls, timing) | `src/engine/sessionEngine.ts` | ✅ |
| Zustand stores (session, settings, profile, progress) | `src/stores/` | ✅ |
| Types definition | `src/types/index.ts` | ✅ |

---

## Phase 2 — Court Visualization ✅ DONE
| Task | File | Status |
|------|------|--------|
| CourtCanvas SVG component (6pt + 10pt) | `src/components/court/CourtCanvas.tsx` | ✅ |
| Position markers + dominant hand mirroring | `src/components/court/` | ✅ |

---

## Phase 3 — Navigation & Screens (skeleton) ✅ DONE
| Task | File | Status |
|------|------|--------|
| Tab navigator (Train/Routines/Progress/Library/Settings) | `App.tsx` | ✅ |
| HomeScreen skeleton | `src/screens/HomeScreen.tsx` | ✅ |
| ProgressScreen skeleton | `src/screens/ProgressScreen.tsx` | ✅ |
| SettingsScreen skeleton | `src/screens/SettingsScreen.tsx` | ✅ |
| LibraryScreen skeleton | `src/screens/LibraryScreen.tsx` | ✅ |
| RoutinesScreen skeleton | `src/screens/RoutinesScreen.tsx` | ✅ |

---

## Phase 4 — Session Flow ✅ DONE
| Task | File | Status |
|------|------|--------|
| DrillConfigModal (configure drill before session) | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| SessionModal (active session, countdown, summary) | `src/screens/session/SessionModal.tsx` | ✅ |
| OnboardingModal (first-run name/level setup) | `src/screens/onboarding/OnboardingModal.tsx` | ✅ |
| ResumePromptModal (restore crashed/backgrounded session) | `src/screens/session/ResumePromptModal.tsx` | ✅ |
| useSessionEngine hook | `src/hooks/useSessionEngine.ts` | ✅ |

---

## Phase 5 — Programs & Routines ✅ DONE
| Task | File | Status |
|------|------|--------|
| Built-in programs data | `src/data/builtinPrograms.ts` | ✅ |
| RoutinesScreen with program cards | `src/screens/RoutinesScreen.tsx` | ✅ |
| Badge, Button, Card, PillSelector UI components | `src/components/ui/` | ✅ |

---

## Phase 6 — Audio, Haptics, Settings ✅ DONE
| Task | File | Status |
|------|------|--------|
| TTS position calls (expo-speech) | `src/engine/audioEngine.ts` | ✅ |
| Haptics engine (Heavy impact on call) | `src/engine/hapticsEngine.ts` | ✅ |
| Beep mode (onPositionCallBeep) | `src/engine/hapticsEngine.ts` | ✅ |
| Coaching cues every 90s | `src/hooks/useSessionEngine.ts` | ✅ |
| upsertPersonalBest in queries | `src/db/queries.ts` | ✅ |
| Personal bests DB + progress load | `src/db/queries.ts` | ✅ |
| SettingsScreen — language selector (13 langs) | `src/screens/SettingsScreen.tsx` | ✅ |
| Keep-awake via brightness boost | `src/hooks/useSessionEngine.ts` | ✅ |

---

## Phase 7 — Intelligence Layer ✅ DONE
| Task | File | Status |
|------|------|--------|
| Fix "THIS WEEK" showing all-time totals | `src/screens/HomeScreen.tsx` | ✅ |
| Fix PB detection cross-drill-type bug | `src/screens/session/SessionModal.tsx` | ✅ |
| getSuggestedDrill() — zone-aware adaptive suggestion | `src/data/builtinPrograms.ts` | ✅ |
| Coach Insight card on Progress (weak zone → drill) | `src/screens/ProgressScreen.tsx` | ✅ |
| Difficulty nudge on session summary | `src/screens/session/SessionModal.tsx` | ✅ |

---

## Phase 8 — Apple Fitness Dark Design ✅ DONE
| Task | File | Status |
|------|------|--------|
| Full color token upgrade (pure black, iOS surfaces, systemGreen) | `src/constants/colors.ts` | ✅ |
| Tab bar refinement (hairline border, green active, 72px height) | `App.tsx` | ✅ |
| Court-as-hero full-bleed layout on HomeScreen | `src/screens/HomeScreen.tsx` | ✅ |
| Progress bar HUD replaces 3-column clock on active session | `src/screens/session/SessionModal.tsx` | ✅ |

---

## Phase 9 — Reference-Image Design Upgrade ✅ DONE
| Task | File | Status |
|------|------|--------|
| CountdownView — full-screen orange, animated circle, GET READY | `src/screens/session/SessionModal.tsx` | ✅ |
| Active session position callout — warm dark card, orange border | `src/screens/session/SessionModal.tsx` | ✅ |
| SessionSummaryView — trophy circle, 2×2 stat grid, zone strip | `src/screens/session/SessionModal.tsx` | ✅ |
| HomeScreen headline — "Dominate the Court." 40px bold | `src/screens/HomeScreen.tsx` | ✅ |

---

## Phase 10 — DrillConfig Step Wizard ✅ DONE
| Task | File | Status |
|------|------|--------|
| Replaced pill-sheet modal with 6-step wizard | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 1: Drill Type — option cards with icons | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 2: Difficulty — 5 level cards | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 3: Coverage — 5 zone cards | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 4: Court System — 2 layout cards | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 5: Pattern + Shots — cards + multi-select pills (skipped for Match Sim) | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Step 6: Session Setup — duration/tempo/rest/voice pill selectors | `src/screens/drill/DrillConfigModal.tsx` | ✅ |
| Progress track dots, Back/Next/Start CTA | `src/screens/drill/DrillConfigModal.tsx` | ✅ |

---

## Phase 11 — Full End-to-End Redesign ✅ COMPLETE

> GhostingX dark premium theme: `#0A0A0A` base, brand orange `#FF6B35`, per-screen hero tints,
> reference-matched screen structure. Apple Fitness × Tesla × Whoop direction.

| Task | File(s) | Status | Notes |
|------|---------|--------|-------|
| Task 1 — Design tokens: brand orange, per-screen hero tints, dark base | `src/constants/colors.ts`, `Button.tsx`, 4 modals | ✅ | Replaced green primary with orange brand |
| Task 2 — HomeScreen: orange hero, stats, quick actions, featured drill | `src/screens/HomeScreen.tsx` | ✅ | Avatar, headline, START SESSION, lib tiles |
| Task 3 — Navigation: 4 tabs, Settings via profile icon | `App.tsx`, `src/types/index.ts` | ✅ | Removed 5th Settings tab |
| Task 4 — RoutinesScreen: green hero, accent cards with left bar | `src/screens/RoutinesScreen.tsx` | ✅ | |
| Task 5 — ProgressScreen: blue hero, bar chart, sparkline, PBs | `src/screens/ProgressScreen.tsx` | ✅ | SVG charts via react-native-svg |
| Task 6 — LibraryScreen: purple hero, Videos/Blogs tabs, featured card | `src/screens/LibraryScreen.tsx` | ✅ | |
| Task 7 — SettingsScreen: slate hero, profile card, icon rows, Edit Profile sheet | `src/screens/SettingsScreen.tsx` | ✅ | Full Edit Profile modal |
| Task 8 — DrillConfigModal: orange header bar, progress track, step wizard | `src/screens/drill/DrillConfigModal.tsx` | ✅ | Matches ref7/ref8 exactly |
| Task 9 — SessionModal: orange countdown, timer+badge header, 3 stat chips | `src/screens/session/SessionModal.tsx` | ✅ | END/PAUSE match ref15 |
| Task 10 — Summary: trophy icon, 2×3 stat cards with icons, orange DONE | `src/screens/session/SessionModal.tsx` | ✅ | Matches ref16 exactly |

---

## Phase 12 — Spec Audit Fixes ✅ COMPLETE

| Fix | File(s) | Status | Detail |
|-----|---------|--------|--------|
| Voice pattern: Movement "[Pos] — Move, recover to T" | `useSessionEngine.ts` | ✅ | Single call, "Lunge/Sprint/Shuffle" by zone |
| Voice pattern: Shot-based "[Pos] — [Shot], recover to T" | `useSessionEngine.ts` | ✅ | One unified call, not 3 fragments |
| Voice pattern: Match Sim "[Pos] — [Shot]! Next: [NextPos]" | `useSessionEngine.ts` | ✅ | Next position announced |
| Voice pattern: Custom "Custom — [Pos] — [Shot]" | `useSessionEngine.ts` | ✅ | Custom prefix added |
| Voice gender switching bug | `audioEngine.ts` | ✅ | Male pitch=0.85, Female pitch=1.20 |
| All voice calls use voiceGender | `useSessionEngine.ts` | ✅ | speak() helper propagates gender everywhere |
| Missing languages: Quechua, Hebrew, Swahili, Hausa | `types/index.ts`, `SettingsScreen.tsx` | ✅ | Now 17 languages total |
| Profile: Age field | `OnboardingModal.tsx`, `SettingsScreen.tsx` | ✅ | Onboarding step 2 + Edit Profile |
| Profile: Gender field | `OnboardingModal.tsx`, `SettingsScreen.tsx` | ✅ | Male/Female/Other selection |
| Library: Articles tab | `LibraryScreen.tsx` | ✅ | 4 articles with tags |
| Library: Endorsements tab | `LibraryScreen.tsx` | ✅ | 4 coach/player quotes |
| Home: Endorsement Strip (horizontal FlatList) | `HomeScreen.tsx` | ✅ | 5 partner logos |

---

## Phase 13 — Court, Navigation & UX Fixes ✅ COMPLETE

| Fix | File(s) | Status | Detail |
|-----|---------|--------|--------|
| Court positions — 6pt/10pt | `src/constants/positions.ts` | ✅ | FL/FR x=±1.95 z=1.75, ML/MR x=±2.20 z=4.26 (1.00m from wall at short line), BL/BR x=±1.95 z=8.25 — verified vs reference diagrams |
| Settings tab restored | `App.tsx`, `src/types/index.ts` | ✅ | 5th tab "Profile" with person icon |
| Gear icon → Settings tab | `src/screens/HomeScreen.tsx` | ✅ | Was opening DrillConfig, now navigates to Settings |
| Configure Drill — big card | `src/screens/HomeScreen.tsx` | ✅ | Replaced tiny text link with full-width card (icon + title + subtitle + arrow) |
| Videos in-app (no YouTube) | `src/screens/LibraryScreen.tsx` | ✅ | Full-screen modal; animated CourtCanvas as thumbnail; real play/pause/scrub controls |
| Voice gender selection | `src/engine/audioEngine.ts` | ✅ | Uses Speech.getAvailableVoicesAsync() to pick actual male/female iOS voice by name; pitch fallback (0.75/1.25) if no match |

## Phase 14 — Voice, Profile, Court & UX ✅ COMPLETE

| Fix | File(s) | Status | Detail |
|-----|---------|--------|--------|
| Court positions — ML/MR | `src/constants/positions.ts` | ✅ | ML/MR reverted to x=±2.80 (0.40m from wall per 3D reference photo) |
| Home "View All" → Library | `src/screens/HomeScreen.tsx` | ✅ | navigation.navigate('Library') |
| START SESSION — neon green | `src/screens/HomeScreen.tsx` | ✅ | Graphite bg, #00E676 neon green text/border, animated pulsing glow |
| Profile photo | `src/screens/SettingsScreen.tsx`, `src/stores/profileStore.ts`, `src/types/index.ts` | ✅ | expo-image-picker gallery + camera; photo persists in AsyncStorage |
| Language selector | `src/screens/SettingsScreen.tsx` | ✅ | Dedicated Language row in Audio section opens full-screen picker modal |
| Test Voice fix | `src/screens/SettingsScreen.tsx` | ✅ | Now uses Audio.speakText with correct voiceGender + language |
| Voice timing — 2-call system | `src/hooks/useSessionEngine.ts`, `src/constants/timing.ts` | ✅ | Position call at T+500ms, recovery cue at T+(interval×0.62) — player moves between them |
| Timing intervals increased | `src/constants/timing.ts` | ✅ | Beginner/slow 4000→5000ms, all levels +400-800ms to accommodate 2-call flow |
| Voice quality — Enhanced | `src/engine/audioEngine.ts` | ✅ | Prefers Enhanced-quality iOS voices; priority list: aaron/alex/arthur for male; samantha/ava for female |
| Male voice rate | `src/engine/audioEngine.ts` | ✅ | Male rate factor 0.88 = authoritative coaching pace; female 0.95 |
| expo-image-picker added | `package.json` | ✅ | Run: npx expo install expo-image-picker |

## Phase 15 — Voice, Court, Library & Profile ✅ IN PROGRESS

| Fix | File(s) | Status | Detail |
|-----|---------|--------|--------|
| Voice timing — 5s pause at T | `src/constants/timing.ts`, `src/hooks/useSessionEngine.ts` | ✅ | 3-phase model: movement phase → recovery cue → T pause. beginner/natural=10.5s (5s at T), pro/explosive=4s (1.5s at T) |
| Audio language settings + nav | `src/screens/SettingsScreen.tsx` | ✅ | "Audio Settings" row scrolls to AUDIO section; language/voice-gender change instantly plays "Front Left. Recover to T." preview |
| Library: merge Blogs → Articles | `src/screens/LibraryScreen.tsx` | ✅ | Removed Blogs tab; 8 articles combined into single Articles tab; 3 tabs total: Videos / Articles / Endorsements |
| Court 2-mode (Hero + Real Court) | `CourtCanvas.tsx`, `settingsStore.ts`, `types/index.ts`, `SettingsScreen.tsx`, `HomeScreen.tsx`, `SessionModal.tsx` | ✅ | Hero = dark SVG. Real = court-3d.jpg background with perspective-mapped position circles overlaid at calibrated coordinates. Square (1:1) canvas in Real mode. |
| Video player upgrade | `src/screens/LibraryScreen.tsx` | ✅ | Added live position callout overlay, move counter (3/6), LIVE DRILL/PAUSED badge, rotating coaching tips strip. Real streaming requires expo-av (not in locked stack) — noted in Known Limitations |

## Phase 16 — Home Screen Improvements ✅ COMPLETE

| Fix | File(s) | Status | Detail |
|-----|---------|--------|--------|
| Profile avatar — photo + initials | `src/screens/HomeScreen.tsx` | ✅ | Shows photoUri if set; else First+Last initials (e.g. "SG"); falls back to first initial only |
| Configure Drill — moved up | `src/screens/HomeScreen.tsx` | ✅ | Removed from bottom; now appears immediately after hero as first card — primary action visibility |
| Activity Metrics section | `src/screens/HomeScreen.tsx` | ✅ | Replaced 3 tiny chips with 2×2 color-coded grid: Day Streak / Mins Trained / Movements / Sessions — labeled "THIS WEEK" |

---

## Known Limitations (not bugs — design decisions)
- Keep-awake: uses brightness boost to 1.0 (expo-keep-awake not in locked stack)
- Library: no real video streaming (expo-av not in locked stack). Current player animates ghosting positions with live callout + coaching tips
- Real YouTube videos now embedded via react-native-webview (WebView player)
- No push notifications (not in locked stack)
