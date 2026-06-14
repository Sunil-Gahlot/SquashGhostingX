# SquashGhostingX — Google Play Store Submission Package
**Version:** 1.0.0 (versionCode: 1)  
**Platform:** Android 10 (API 29)+  
**Expo SDK:** 54  

---

## PART A: APP IDENTITY

| Field | Value |
|---|---|
| **App Name** | SquashGhostingX |
| **Package Name** | `com.[YOUR_COMPANY].squashghostingx` ⚠️ *Replace before build* |
| **Default Language** | English (United States) |
| **Category** | Sports |
| **Tags** | squash, fitness, training, sport, ghosting, coaching |

---

## PART B: STORE LISTING

### Short Description (80 chars max)
```
AI-guided squash ghosting coach with voice, analytics & pro programs
```

### Full Description (4000 chars max)
```
SquashGhostingX is the most advanced squash ghosting training app — AI-guided court movement, 
real-time voice coaching, and deep performance analytics in one premium package.

WHAT IS GHOSTING?
Ghosting is the gold standard solo squash drill. You move to all six corners of the court 
— front left, front right, mid-court, back left, back right, and the T — without a ball, 
building explosive footwork, court coverage, and match-day fitness. Used by PSA professionals worldwide.

TRAIN SMARTER
• 6-Point and 10-Point court systems
• 5 difficulty levels: Beginner → Intermediate → Advanced → Elite → Pro
• 3 speed modes: Slow, Natural, and Explosive
• Shot-based, movement, match simulation, and custom drills
• Cross-court, straight, and mixed shot patterns
• Structured programs for every skill level

REAL-TIME VOICE COACHING
• Hands-free position calls: "Front Left!", "Back Right!", "Recover to T!"
• Mid-session coaching cues to keep you motivated and focused
• Male and female coach voices
• 13 languages: English (US/UK), Spanish, French, German, Italian, Portuguese, Dutch, Hindi, Arabic, Chinese, Japanese, Korean
• Audio continues when screen is locked

TRACK YOUR PROGRESS
• Daily streaks to build your training habit
• Weekly load charts — reps per day
• Court balance analysis — front, mid, and back distribution
• Personal bests by drill type
• Session history with intensity scores
• AI Coach Insight: detects your weakest zone and recommends targeted drills

SMART SESSION CONTROL
• Live pace control during sessions (7 speed steps)
• Auto or manual rest between sets
• Keep-Screen-Awake during active sessions
• Session resume after unexpected exits
• Reduced Motion mode for accessibility

PREMIUM DARK INTERFACE
• Hero Court and Real Wood court styles
• Smooth animations with Reduced Motion option
• Portrait-optimised for phones, tablet-compatible

Start your first session in under 60 seconds. No equipment. No partner. No excuses.
```

---

## PART C: GRAPHIC ASSETS

### Required Assets

| Asset | Size | Format | Notes |
|---|---|---|---|
| App Icon | 512×512 px | PNG (32-bit) | No alpha required for Play Store |
| Feature Graphic | 1024×500 px | JPG or PNG | Required — appears at top of listing |
| Screenshots (phone) | 1080×1920 min | PNG or JPG | Min 2, max 8 |
| Screenshots (7" tablet) | 1080×1920 min | PNG or JPG | Optional |
| Screenshots (10" tablet) | 1920×1200 min | PNG or JPG | Optional |

### Adaptive Icon (already configured in app.json)
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#160800"
  }
}
```
✅ Adaptive icon is configured. Verify `assets/adaptive-icon.png` is 1024×1024 px with safe zone within center 66%.

### Feature Graphic (1024×500 px)
Create a landscape banner with:
- Dark background (`#160800` to match splash)
- App name: "SquashGhostingX" in bold
- Tagline: "Train Hard. Play Fearless."
- Court icon or player silhouette
- Brand orange accent (#FF6B35)

### Recommended Screenshot Flow (6-8 shots, phone portrait)
1. Auth welcome screen — "Train Hard. Play Fearless." slide
2. Home screen — hero with START SESSION button
3. Drill Config modal — showing options
4. Active session — court diagram with position highlighted
5. Progress screen — streak + weekly chart
6. Routines — program category grid
7. Settings — voice/audio configuration
8. Profile screen — skill level and coaching prefs

---

## PART D: CONTENT RATING

Complete the IARC questionnaire with these answers:

| Question | Answer |
|---|---|
| Violence | No |
| Sexual content | No |
| Language | No (no profanity) |
| Controlled substances | No |
| Gambling | No |
| User-generated content | No |
| Data sharing with third parties | No |

**Result: Rating Everyone (E) / PEGI 3**

---

## PART E: APP CATEGORY & TAGS

| Field | Value |
|---|---|
| **Category** | Sports |
| **Content Type** | Application |
| **Target Audience** | 13+ (teen and adult athletes) |

---

## PART F: PRIVACY POLICY

**⚠️ REQUIRED:** Google Play requires a privacy policy for all apps.  
```
Privacy Policy URL: https://[YOUR_WEBSITE]/privacy   ← REPLACE
```
See `PRIVACY_POLICY.md` in this folder for full privacy policy text.

---

## PART G: DATA SAFETY SECTION

Google Play requires a completed Data Safety section. Answer each question accurately:

### Does your app collect or share any of the required user data types?

| Data Type | Collected | Shared | Purpose | Required |
|---|---|---|---|---|
| Email address | Yes (device-local) | No | App functionality (account creation) | ✅ |
| Name | Yes (device-local) | No | App functionality (profile) | ✅ |
| Photos/videos | Yes (optional, device-local) | No | Profile photo | ✅ |
| Fitness info | Yes (session data, device-local) | No | Training analytics | ✅ |
| App interactions | Yes (session events, SQLite) | No | Progress tracking | ✅ |

### Is all data encrypted in transit?
For v1.0 (no server): **N/A — data never leaves the device.**  
If backend is added: Must use TLS 1.2+ for all transmissions.

### Can users request data deletion?
**Yes** — "Reset Progress History" and "Reset All Settings" in the app delete all stored data.

### Data Safety declaration summary:
```
This app stores your training data locally on your device only. 
No personal data is transmitted to external servers. 
You can delete all data at any time from the Settings screen.
```

---

## PART H: WHAT'S NEW (Release Notes)

```
SquashGhostingX 1.0 — First Release

• 6-Point and 10-Point ghosting court systems
• AI voice coaching in 13 languages
• 5 difficulty levels: Beginner to Pro
• Weekly analytics, streaks, and personal bests
• Structured training programs for every level
• Live pace control during sessions
• Court balance analysis and AI coach insights
• Session auto-resume after unexpected exits
• Hero Court and Real Wood court styles
```

---

## PART I: PERMISSIONS

### Required permissions (add to `app.json` android section before build):

```json
"android": {
  "permissions": [
    "READ_EXTERNAL_STORAGE",
    "READ_MEDIA_IMAGES",
    "VIBRATE",
    "FOREGROUND_SERVICE",
    "FOREGROUND_SERVICE_MEDIA_PLAYBACK"
  ]
}
```

### Permission rationale (shown to users or in Play Console):

| Permission | Why Required |
|---|---|
| `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` | Allows users to set a profile photo from their gallery |
| `VIBRATE` | Haptic feedback fires on each court position call during training |
| `FOREGROUND_SERVICE` | Required for audio to continue when the screen locks during a session |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Android 14+ classification for audio foreground service |

---

## PART J: TESTING & REVIEW CREDENTIALS

### Test Account for Reviewers
| Field | Value |
|---|---|
| Email | `reviewer@squashghostingx.com` ⚠️ *Pre-register this account before submitting* |
| Password | `TestPass123!` |

### Testing Instructions (add to Play Console notes)
```
Welcome to SquashGhostingX — a squash ghosting training app.

TO TEST CORE FEATURES:
1. Launch app → select "Create Account" → enter the test credentials above → complete 2-step onboarding
2. On the Train tab, tap "START SESSION" — a 3-second countdown begins, followed by voice calls 
   to court positions. This is a fitness drill; the app calls positions you'd move to on a squash court.
3. During the session, use the +/- buttons to change pace
4. End the session early with the stop button
5. Visit the Progress tab to see session stats

BACKGROUND AUDIO:
Lock the device screen during an active session — voice coaching will continue in the background.
This requires the Foreground Service permission which will be requested on first session start.

PROFILE PHOTO:
Tap your avatar on the Train tab or visit Profile → tap the avatar image → grant gallery permission.
```

---

## PART K: ANDROID-SPECIFIC TECHNICAL NOTES

### API Level Targeting
```json
"android": {
  "targetSdkVersion": 35,
  "minSdkVersion": 29
}
```
⚠️ Google Play requires `targetSdkVersion >= 35` for new apps submitted after 2025-08-31. Add `targetSdkVersion: 35` to `app.json`.

### Edge-to-Edge (already configured)
```json
"android": {
  "edgeToEdgeEnabled": true,
  "predictiveBackGestureEnabled": false
}
```
✅ Already configured correctly.

### ProGuard / R8
Expo handles minification. If you add custom native modules, verify they are not obfuscated.

### 64-bit Support
Expo React Native 0.81.5 builds 64-bit APKs by default. ✅

### App Bundle (AAB) vs APK
Submit as Android App Bundle (`.aab`) — required for new apps on Play Store.

```bash
# Build AAB for Play Store
eas build --platform android --profile production
```

---

## PART L: BUILD COMMANDS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

### eas.json additions for Android
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## PART M: PLAY CONSOLE SETUP STEPS

1. **Create Developer Account** at play.google.com/console ($25 one-time fee)
2. **Create App** → App name: "SquashGhostingX" → Free → App → Published
3. **Complete Store Listing** (Part B assets and descriptions above)
4. **Data Safety** (Part G above)
5. **Content Rating** (Part D above — complete IARC questionnaire)
6. **App Signing** — use Play App Signing (Google manages keystore)
7. **Upload AAB** via Releases → Production → Create new release
8. **Add testers** (optional internal/closed testing before production)
9. **Submit for Review**

### Typical Review Timeline
- New apps: 3–7 business days
- Updates: 1–3 business days

---

## PART N: GOOGLE PLAY CHECKLIST

- [ ] Package name set in app.json ⚠️ *CRITICAL: Not set*
- [ ] Target SDK 35 added to app.json ⚠️ *Missing*
- [ ] App description filled (≤4000 chars) ✓
- [ ] Short description filled (≤80 chars) ✓
- [ ] Feature graphic created (1024×500 px) ⚠️ *Pending*
- [ ] At least 2 phone screenshots ⚠️ *Pending*
- [ ] App icon (512×512 PNG) ⚠️ *Verify assets/icon.png*
- [ ] Adaptive icon configured ✓
- [ ] Content rating questionnaire completed ⚠️ *Pending (in Play Console)*
- [ ] Privacy policy URL live ⚠️ *Pending*
- [ ] Data Safety section filled ⚠️ *Pending (in Play Console)*
- [ ] Test credentials added ⚠️ *Pending*
- [ ] AAB uploaded via EAS ⚠️ *Pending*
- [ ] Permissions declared in app.json ⚠️ *VIBRATE, FOREGROUND_SERVICE missing*
