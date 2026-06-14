# SquashGhostingX — Go-Live Checklist
**Generated:** June 10, 2026 | **App Version:** 1.0.0 (Build 1)

---

## LEGEND
- ✅ Done — fixed automatically or already in place
- ⚠️ Action Required — you must do this manually
- ℹ️ Info — no action needed, noted for awareness

---

## PART 1 — APP STORE REJECTION RISKS

### Privacy & Legal

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | Privacy Policy exists | ✅ | `store-submission/Privacy_Policy.md` — all placeholders filled |
| 2 | Privacy Policy hosted at public URL | ⚠️ | **Must host at `https://squashghostingx.com/privacy` before submitting** |
| 3 | Privacy Policy URL tappable in app | ✅ | Fixed — `Linking.openURL` now opens the URL from About alert |
| 4 | Support email tappable in app | ✅ | Fixed — `mailto:support@squashghostingx.com` opens Mail app |
| 5 | No GDPR/CCPA data collection | ✅ | All data is 100% local — no server, no cloud, no tracking |
| 6 | No ATT tracking prompt needed | ✅ | No ad SDKs, no cross-app tracking — ATT not required |
| 7 | Children's privacy (COPPA) | ✅ | Policy states 13+ minimum; app has no content directed at children |

### App Identity & Config

| # | Check | Status | Notes |
|---|---|---|---|
| 8 | Bundle ID set (iOS) | ✅ | `com.squashghostingx.app` in app.json |
| 9 | Package name set (Android) | ✅ | `com.squashghostingx.app` in app.json |
| 10 | Version number | ✅ | `1.0.0` / buildNumber `1` / versionCode `1` |
| 11 | eas.json created | ✅ | Created with development / preview / production profiles |
| 12 | Apple ID in eas.json | ✅ | `sunilgahlot@gmail.com` |
| 13 | ASC App ID in eas.json | ⚠️ | Replace `FILL_IN_FROM_APP_STORE_CONNECT` — find in App Store Connect → App → General → Apple ID |
| 14 | Apple Team ID in eas.json | ⚠️ | Replace `FILL_IN_FROM_DEVELOPER_APPLE_COM` — find at developer.apple.com/account → Membership |
| 15 | Google Play service account key | ⚠️ | Create `google-play-key.json` — see Part 4 below |
| 16 | Export compliance (iOS) | ✅ | `ITSAppUsesNonExemptEncryption: false` added to app.json — skips encryption question |

### Permissions

| # | Check | Status | Notes |
|---|---|---|---|
| 17 | iOS photo library permission string | ✅ | `NSPhotoLibraryUsageDescription` in app.json |
| 18 | iOS Face ID permission string | ✅ | `NSFaceIDUsageDescription` in app.json |
| 19 | iOS background audio | ✅ | `UIBackgroundModes: ["audio"]` in app.json |
| 20 | Android image read permission | ✅ | `READ_MEDIA_IMAGES` + `READ_EXTERNAL_STORAGE` declared |
| 21 | Android vibration permission | ✅ | `VIBRATE` declared |
| 22 | Android foreground service | ✅ | `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` declared |
| 23 | Android targetSdkVersion | ✅ | `35` — meets Google Play requirement |
| 24 | No camera permission needed | ✅ | App only uses photo library picker, not camera |
| 25 | No microphone permission needed | ✅ | App uses TTS (expo-speech), not speech recognition |

### App Content & Functionality

| # | Check | Status | Notes |
|---|---|---|---|
| 26 | Guest/demo mode available | ✅ | "Continue as Guest" works without account creation |
| 27 | No broken navigation | ✅ | All 5 tabs + modals verified in UAT |
| 28 | No crashes in tested flows | ✅ | UAT review passed all critical paths |
| 29 | No placeholder content in UI | ✅ | All TextInput placeholders are legitimate form hints |
| 30 | No non-functional buttons | ✅ | All buttons wired; About alert buttons now functional |
| 31 | No "coming soon" gating login | ✅ | Pro features show empty state, not blocked auth |
| 32 | Login not required to evaluate | ✅ | Guest mode allows full app exploration |
| 33 | No unimplemented IAP | ✅ | No in-app purchases exist — app is fully free |
| 34 | No social auth promise | ✅ | Social auth buttons removed; email + guest only |
| 35 | No PRO badge without purchase | ✅ | PRO badge removed from auth screen |

### Assets

| # | Check | Status | Notes |
|---|---|---|---|
| 36 | App icon exists | ✅ | `assets/icon.png` (~1.2 MB) |
| 37 | App icon is 1024×1024 PNG | ⚠️ | **Verify in Preview/Photoshop — Apple rejects if not exactly 1024×1024** |
| 38 | App icon has no alpha channel | ⚠️ | **Apple rejects icons with transparency — flatten/remove alpha if present** |
| 39 | Adaptive icon exists (Android) | ✅ | `assets/adaptive-icon.png` |
| 40 | Splash screen exists | ✅ | `assets/splash-icon.png` |
| 41 | App Store screenshots created | ⚠️ | **6 screenshots required per device size — see Part 2** |
| 42 | Google Play feature graphic | ⚠️ | **1024×500 px PNG required for Play Store listing** |

---

## PART 2 — SCREENSHOTS REQUIRED

### Apple App Store
Apple requires screenshots for at least these device sizes:

| Device | Size | Quantity |
|---|---|---|
| iPhone 6.7" (iPhone 15 Pro Max) | 1290×2796 px | 3–10 |
| iPhone 6.5" (iPhone 14 Plus) | 1284×2778 px | 3–10 |
| iPad Pro 12.9" (6th gen) | 2048×2732 px | 3–10 (if supportsTablet: true) |

**Recommended screens to capture:**
1. Home screen — "Good morning / START SESSION"
2. Active session — court with highlighted position + voice cue
3. Session results — stats after completing a drill
4. Progress screen — streaks, zone balance, personal bests
5. Routines — program library
6. Settings — voice/difficulty controls

**How to take screenshots:**
- Run on iOS Simulator in Xcode (or physical device)
- Use `eas build --profile preview --platform ios` to get a simulator build
- Screenshot via Cmd+S in simulator, or Xcode → Device → Take Screenshot

### Google Play Store

| Asset | Size |
|---|---|
| Feature Graphic | 1024×500 px (required) |
| Phone Screenshots | Min 2, max 8 — any 16:9 ratio |
| Tablet Screenshots | Optional but recommended |

---

## PART 3 — BUILD COMMANDS

Run these in order:

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Link this project to your Expo account (one-time)
eas init

# 4. Build for iOS (production)
eas build --platform ios --profile production

# 5. Build for Android (production)
eas build --platform android --profile production

# 6. Submit to Apple App Store (after build completes)
eas submit --platform ios --profile production

# 7. Submit to Google Play (after build completes)
eas submit --platform android --profile production
```

> **Note:** `eas init` will add an `extra.eas.projectId` to your `app.json` automatically.
> You must run this before building.

---

## PART 4 — GOOGLE PLAY SERVICE ACCOUNT KEY

To use `eas submit` for Android, you need a Google Play service account JSON key:

1. Go to [Google Play Console](https://play.google.com/console)
2. Setup → API access → Link to Google Cloud Project
3. Create a Service Account with "Release Manager" role
4. Download the JSON key and save as `google-play-key.json` in the project root
5. **Add `google-play-key.json` to `.gitignore`** — it contains private credentials

---

## PART 5 — APP STORE CONNECT SETUP (iOS)

1. Sign in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. My Apps → + → New App
3. Fill in:
   - **Name:** SquashGhostingX
   - **Bundle ID:** com.squashghostingx.app
   - **SKU:** squashghostingx-ios-v1
   - **Primary Language:** English (U.S.)
4. App Information:
   - **Category:** Health & Fitness
   - **Secondary:** Sports
   - **Age Rating:** 4+ (no mature content)
   - **Privacy Policy URL:** https://squashghostingx.com/privacy
5. Pricing → Free
6. Upload screenshots from Part 2
7. Fill in description from `store-submission/iOS_App_Store_Submission.md`
8. Copy your **Apple ID** (numeric, e.g. `1234567890`) from App Information → fill into `eas.json`
9. Copy your **Team ID** from developer.apple.com/account → Membership → fill into `eas.json`

### Data Safety Declaration (App Store Connect)
Apple will ask "Does your app collect data?" — Answer:
- **Data not collected from users:** Everything is stored locally on device
- **No data linked to user identity on any server**
- **No tracking**

---

## PART 6 — GOOGLE PLAY CONSOLE SETUP (Android)

1. Sign in at [play.google.com/console](https://play.google.com/console)
2. Create app → SquashGhostingX → Free → App
3. Store listing:
   - **Short description** (80 chars): `AI-guided squash ghosting coach with voice coaching and analytics`
   - **Full description:** Use content from `store-submission/Google_Play_Submission.md`
   - **Category:** Health & Fitness → Fitness
   - **Privacy Policy URL:** https://squashghostingx.com/privacy
4. Upload feature graphic (1024×500 px) and screenshots
5. Content rating questionnaire → complete all sections → Rating: Everyone
6. Data Safety section:
   - **No data collected** (all local)
   - **No data shared with third parties**
   - **No data sold**

---

## PART 7 — REMAINING MANUAL ACTIONS (Priority Order)

| Priority | Action |
|---|---|
| 🔴 CRITICAL | Host privacy policy at `https://squashghostingx.com/privacy` |
| 🔴 CRITICAL | Fill in `ascAppId` and `appleTeamId` in `eas.json` |
| 🔴 CRITICAL | Create Google Play service account key → save as `google-play-key.json` |
| 🔴 CRITICAL | Verify `assets/icon.png` is exactly 1024×1024 with no alpha channel |
| 🟡 REQUIRED | Create App Store screenshots (6 per device size) |
| 🟡 REQUIRED | Create Google Play feature graphic (1024×500 px) |
| 🟡 REQUIRED | Run `eas init` to link project to Expo account |
| 🟢 OPTIONAL | Set up App Store Connect and Play Console listings |
| 🟢 OPTIONAL | Set up `google-play-key.json` for automated submission |

---

## SUMMARY — WHAT WAS FIXED AUTOMATICALLY

| File | What Changed |
|---|---|
| `eas.json` | Created from scratch — development / preview / production build profiles + submit config |
| `store-submission/Privacy_Policy.md` | All placeholders filled; stale SecureStore text corrected |
| `src/screens/SettingsScreen.tsx` | Added `Linking` import; Privacy Policy and Email Support are now tappable links |
| `app.json` | Added `ITSAppUsesNonExemptEncryption: false` — prevents unnecessary export compliance delay |
