# SquashGhostingX — Apple App Store Submission Package
**Version:** 1.0.0 (Build 1)  
**Platform:** iOS 16.0+  
**Expo SDK:** 54  

---

## PART A: APP IDENTITY

| Field | Value |
|---|---|
| **App Name** | SquashGhostingX |
| **Subtitle** | AI Ghosting Coach & Trainer |
| **Bundle ID** | `com.[YOUR_COMPANY].squashghostingx` ⚠️ *Replace before build* |
| **SKU** | `squashghostingx-ios-v1` |
| **Primary Language** | English (U.S.) |
| **Category** | Health & Fitness |
| **Secondary Category** | Sports |

---

## PART B: APP DESCRIPTION

### Short Description (30 chars — used in search results)
```
AI Squash Ghosting Trainer
```

### Full Description (4000 chars max)
```
SquashGhostingX is the most advanced squash ghosting training app available — combining AI-guided 
court movement, real-time voice coaching, and deep performance analytics in one premium package.

WHAT IS GHOSTING?
Ghosting is the gold standard solo training drill for squash. You move to all corners of the court 
— front left, front right, mid-court, back left, back right, and the T — without a ball, 
training your footwork, court coverage, and recovery speed. Used by PSA professionals worldwide.

TRAIN LIKE A PRO
• 6-Point and 10-Point court systems — from club-level to professional patterns
• 5 difficulty levels: Beginner → Intermediate → Advanced → Elite → Pro
• 3 speed modes: Slow, Natural, and Explosive
• Shot-based, movement, match simulation, and custom drill types
• Cross-court, straight, and mixed shot patterns
• Structured programs from Beginner to PSA Pro level

REAL-TIME AI COACHING
• Voice calls each court position by name — completely hands-free
• Recovery cues fire automatically: "Back to T!", "Recover to T!"
• Mid-session encouragement and coaching cues keep you motivated
• Male and female coach voices with pitch and rate optimisation
• 13 languages: English (US/UK), Spanish, French, German, Italian, Portuguese, Dutch, Hindi, Arabic, Chinese, Japanese, Korean

TRACK EVERY MOVEMENT
• Streak tracking — build your daily training habit
• Weekly load chart — reps per day across the week
• Court balance analysis — front, mid, and back court distribution
• Personal bests by drill type across reps, intensity, and completion
• Session history with intensity scores and completion percentages
• Coach Insight: AI detects your weakest court zone and recommends the right drill

SMART CUSTOMISATION
• Live pace control during sessions (+/- speed in 7 steps)
• Adjustable rest periods between sets
• Auto-rest or manual rest modes
• Keep Screen Awake during sessions
• Reduced Motion mode for accessibility
• Background audio — continues when screen locks

BUILT FOR EVERY DEVICE
• Portrait-optimised for iPhone; tablet-compatible for iPad
• Audio plays through silent mode
• Haptic feedback on every court call
• Dark mode premium interface

Whether you're a club player improving your fitness or a competitive athlete training for tournaments, 
SquashGhostingX brings professional ghosting training to your pocket.

Start your first session in under 60 seconds.
```

---

## PART C: KEYWORDS (100 chars max)

```
squash,ghosting,training,fitness,footwork,coach,drill,sport,court,movement,agility,workout,PSA
```

---

## PART D: PROMOTIONAL TEXT (170 chars — can be updated without resubmission)

```
AI-powered squash ghosting with real-time voice coaching. Train at any level, track every rep, and dominate the court.
```

---

## PART E: WHAT'S NEW (Release Notes)

```
Welcome to SquashGhostingX 1.0!

• 6-Point and 10-Point court ghosting systems
• AI voice coaching in 13 languages
• 5 difficulty levels from Beginner to Pro
• Weekly analytics, streaks, and personal bests
• Structured programs for every skill level
• Live pace control during sessions
• Court balance analysis and coach insights
• Session resume after unexpected exits
```

---

## PART F: APP INFORMATION

### Age Rating
Complete the questionnaire with these answers:

| Category | Rating |
|---|---|
| Cartoon/Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content | None |
| Nudity | None |
| Profanity/Crude Humor | None |
| Alcohol, Tobacco, Drugs | None |
| Gambling | None |
| Contests/Sweepstakes | None |
| Horror/Fear Themes | None |
| Mature/Suggestive Themes | None |
| Medical/Treatment Info | None |

**Result: Rating 4+**

### Content Rights
- Does your app contain, display, or access third-party content? **No**
- Does your app use third-party material that you have rights to? **No** (YouTube thumbnails loaded from public URLs — see Legal Notes below)

---

## PART G: PRICING & AVAILABILITY

| Field | Value |
|---|---|
| **Price** | Free *(recommended for v1.0)* |
| **Availability** | All territories |
| **Pre-order** | No |

---

## PART H: PRIVACY POLICY

**⚠️ REQUIRED:** A privacy policy URL is mandatory for all apps. You must host a privacy policy before submission. See `PRIVACY_POLICY.md` in this folder for the full text to host.

```
Privacy Policy URL: https://[YOUR_WEBSITE]/privacy   ← REPLACE
```

---

## PART I: APP STORE CONNECT — APP REVIEW INFORMATION

### Sign-In Required?
**Yes** — reviewer needs test credentials.

| Field | Value |
|---|---|
| **Test Account Email** | `reviewer@squashghostingx.com` ⚠️ *Create this account in the app before submission* |
| **Test Account Password** | `TestPass123!` ⚠️ *Use a strong test password; register via Create Account flow* |

### Notes for Reviewer
```
This is a squash ghosting training app. Key features to test:

1. ONBOARDING: Launch app → tap "Create Account" → enter email/password 
   (or use test credentials above) → complete onboarding profile steps.

2. START A SESSION: Tap "START SESSION" on the Train tab. The app will count down 
   from 3 and begin calling court positions by voice. Hold the phone and pretend 
   to move to each position — this is a fitness drill. Session will continue for 
   the configured duration (minimum 5 minutes).

3. PROGRESS: After completing a session, visit the Progress tab to see tracked 
   stats, weekly chart, and achievements.

4. SETTINGS: Settings tab allows voice configuration, difficulty defaults, and 
   language changes.

SOCIAL AUTH BUTTONS: The Apple, Google, and Facebook sign-in buttons are present 
in the interface. These currently show an informational alert explaining that 
backend integration is required and offering guest or email alternatives. 
This is intentional for v1.0 — full social auth is planned for v1.1.

[IF SOCIAL BUTTONS ARE REMOVED BEFORE SUBMISSION, DELETE THE PARAGRAPH ABOVE]

BACKGROUND AUDIO: If you lock the device during a session, voice coaching 
continues in the background — this requires the microphone/audio background mode.
```

### Demo Video
- Not required but recommended — record a 30-second screen recording showing:
  1. Auth → Onboarding
  2. Start session → 3 position calls
  3. Progress tab with data

---

## PART J: APP CAPABILITIES & PERMISSIONS

### Required Permissions (must be declared in app.json → Info.plist)

| Permission | Usage Description (shown to user) |
|---|---|
| `NSPhotoLibraryUsageDescription` | Used to set your profile photo from your photo library. |
| `NSMicrophoneUsageDescription` | *(Only if using speech recognition in future)* Not currently used. |
| `UIBackgroundModes: audio` | Voice coaching continues when the screen is locked during a session. |

**Confirm these are in app.json before build:**
```json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["audio"],
    "NSPhotoLibraryUsageDescription": "Used to set your profile photo from your photo library."
  }
}
```
⚠️ `NSPhotoLibraryUsageDescription` must be added — currently missing from `app.json`.

### Data Collection (App Privacy Labels)

| Data Type | Collected | Linked to User | Used for Tracking |
|---|---|---|---|
| Email Address | Yes (device-local only) | No (not transmitted) | No |
| Name | Yes (device-local only) | No | No |
| Health & Fitness | Yes (session reps, duration) | No | No |
| User Content (photo) | Optional (device-local only) | No | No |
| Diagnostics / Crash Data | No | — | — |

**Privacy Nutrition Label Summary:**  
→ Select **"Data Not Collected"** if no data is transmitted to any server.  
→ Select **"Data Linked to You → Email Address"** only if you implement backend auth.

For v1.0 (device-local only): **Data Not Collected from external servers.**

---

## PART K: TECHNICAL REQUIREMENTS

| Requirement | Status |
|---|---|
| Minimum iOS version | iOS 16.0 |
| iPhone support | ✅ |
| iPad support | ✅ (supportsTablet: true) |
| New Architecture (Fabric/JSI) | ✅ Enabled |
| Bitcode | Not required for iOS 16+ |
| Privacy Manifest | ⚠️ Required for iOS 17+ — see below |

### Privacy Manifest (PrivacyInfo.xcprivacy)
Apple requires a `PrivacyInfo.xcprivacy` file in your app bundle for iOS 17+ if the app uses any of the "required reasons" APIs. SquashGhostingX uses:
- `AsyncStorage` → uses `NSPrivacyAccessedAPICategoryUserDefaults` (file-based storage)
- `SQLite` → no declared API reason needed (custom file I/O)

Add `PrivacyInfo.xcprivacy` to your Xcode project before submission. Expo provides this via EAS Build for SDK 51+.

---

## PART L: SCREENSHOTS REQUIREMENTS

### Required Sizes
| Device | Size | Required |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 × 2868 px | ✅ Required |
| iPhone 6.5" (iPhone 14 Plus) | 1284 × 2778 px | ✅ Required |
| iPad Pro 13" (M4) | 2064 × 2752 px | Required if tablet is supported |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 px | Required if tablet is supported |

### Recommended Screenshot Flow (6 shots)
1. **Auth / Welcome** — Show slide 1 "Train Hard. Play Fearless." with brand name
2. **Home — Hero** — Show greeting + START SESSION button with neon glow
3. **Drill Config** — Show the config modal with settings
4. **Active Session** — Show court diagram + current position highlighted
5. **Progress** — Show streak card + weekly chart + recent sessions
6. **Routines** — Show the 6-category program grid

### Screenshot Design Tips
- Use a dark background (app is already dark-first)
- Add device frames using Sketch, Figma, or AppLaunchpad
- Add a 2-line headline overlay on each screenshot (e.g., "Train Like a Pro · No Partner Needed")
- Keep text under 40% of the screenshot area

---

## PART M: APP STORE LISTING CHECKLIST

- [ ] App name: "SquashGhostingX" (≤30 chars) ✓
- [ ] Subtitle filled (≤30 chars) ✓
- [ ] Full description filled (≤4000 chars) ✓
- [ ] Keywords filled (≤100 chars) ✓
- [ ] Promotional text filled (≤170 chars) ✓
- [ ] What's New / Release Notes filled ✓
- [ ] Privacy Policy URL live and accessible ⚠️ *Pending*
- [ ] Age rating questionnaire completed (4+) ✓
- [ ] Support URL set ⚠️ *Pending — add website/support email*
- [ ] Marketing URL set (optional) ⚠️ *Pending*
- [ ] At least 3 iPhone screenshots uploaded ⚠️ *Pending*
- [ ] App icon 1024×1024 px PNG (no alpha, no rounded corners) ⚠️ *Verify assets/icon.png*
- [ ] Test account credentials added in App Review section ⚠️ *Pending*
- [ ] Bundle identifier set in app.json ⚠️ *CRITICAL: Not set*
- [ ] NSPhotoLibraryUsageDescription added to app.json ⚠️ *Missing*
- [ ] Build uploaded via EAS Submit or Transporter ⚠️ *Pending*

---

## PART N: BUILD & SUBMIT COMMANDS

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project (first time only — generates eas.json)
eas build:configure

# Production build for iOS
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --latest
```

### eas.json (create this if it doesn't exist)
```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": { "simulator": false }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

## PART O: LEGAL NOTES

1. **YouTube Thumbnails:** The app loads thumbnail images from `https://img.youtube.com/vi/{id}/hqdefault.jpg`. These are publicly served by YouTube. However, if the app is ever rejected for this, replace with locally bundled thumbnail images.

2. **"SquashGhostingX" Trademark:** Verify the name is not trademarked in target territories before submission.

3. **Apple Sign-In Requirement:** If any social login button (Google, Facebook) appears in the UI, Apple Sign-In MUST also be available and functional. For v1.0, remove all social buttons to avoid this requirement.
