# SquashGhostingX — Production Deployment Guide

## Prerequisites

### Apple Developer Account
- Enroll at https://developer.apple.com ($99/year)
- Accept latest Apple Developer agreements at https://developer.apple.com/account
- Create an App Store Connect record at https://appstoreconnect.apple.com
  1. My Apps → "+" → New App
  2. Platform: iOS, Name: SquashGhostingX
  3. Bundle ID: com.squashghostingx.app
  4. SKU: squashghostingx (any unique string)
  5. Copy the **Apple ID** (numeric, e.g. 123456789) → paste into `eas.json` `ascAppId`
  6. Copy your **Team ID** from https://developer.apple.com/account → Membership → paste into `eas.json` `appleTeamId`

### Google Play Console
- Enroll at https://play.google.com/console ($25 one-time)
- Create a new app: Apps → Create app → Android, Free, Not a game
- Create a service account key (required for `eas submit`):
  1. Google Play Console → Setup → API access
  2. Link to a Google Cloud project (or create one)
  3. Create a Service Account → grant it **Release Manager** role
  4. Create a JSON key → download it → save as `google-play-key.json` in this project root
  5. Grant the service account access in Play Console → Users and permissions → Invite user

### EAS CLI
```bash
npm install -g eas-cli
eas login          # use sunilgahlot@gmail.com
eas init           # links this project to your Expo account — run ONCE
```

---

## Asset Requirements (manual — must be done before first build)

| Asset | Size | Path | Notes |
|---|---|---|---|
| App Icon | 1024×1024 px PNG, no alpha | `assets/icon.png` | Square, no rounded corners — stores apply them |
| Android Adaptive Icon | 1024×1024 px PNG, no alpha | `assets/adaptive-icon.png` | Foreground layer only; leave 1/3 padding all sides |
| Splash Screen | 1284×2778 px PNG (or larger) | `assets/splash-icon.png` | Centre your logo; edges are cropped on smaller devices |
| Favicon | 196×196 px PNG | `assets/favicon.png` | Web only |
| App Store Screenshots | 1290×2796 px (iPhone 15 Pro Max) | — | Min 3, max 10 per locale; upload in App Store Connect |
| iPad Screenshots | 2064×2752 px | — | Required if `supportsTablet: true` |
| Google Play Feature Graphic | 1024×500 px PNG/JPG | — | Upload in Play Console store listing |

---

## EAS Submit IDs (already configured)

`eas.json` submit config is complete:

```json
"appleId":     "sunilgahlot@gmail.com"
"ascAppId":    "6749510678"
"appleTeamId": "X5WPU3FJ39"
```

The only remaining manual step is downloading the Google Play service account JSON key
and saving it as `./google-play-key.json` in the project root.

---

## Build Commands

### Android Production (.aab for Google Play)
```bash
eas build --platform android --profile production
```
Downloads as `*.aab`. Do NOT upload APK to Play Store for new apps — Play requires AAB.

### iOS Production (.ipa for App Store)
```bash
eas build --platform ios --profile production
```
EAS manages signing automatically (provisioning profile + distribution certificate).
You will be prompted to log into your Apple Developer account the first time.

### Both platforms simultaneously
```bash
eas build --platform all --profile production
```

### Preview / QA builds (internal testing)
```bash
# Android APK — install directly on device
eas build --platform android --profile preview

# iOS — distribute via TestFlight or direct install (requires device UDID registered)
eas build --platform ios --profile preview
```

---

## Submit Commands

### Submit to Google Play (internal track → then promote)
```bash
eas submit --platform android --profile production
```
First submission must be done manually via the Play Console (upload AAB, fill store listing).
Subsequent submissions use the service account key automatically.

### Submit to App Store Connect
```bash
eas submit --platform ios --profile production
```
EAS uploads the IPA to App Store Connect. Then in App Store Connect:
1. Go to TestFlight → wait for processing (~15 min)
2. Submit for App Review

---

## Version Management

`eas.json` uses `"appVersionSource": "remote"` and `"autoIncrement": true`.

- **Build number** (iOS `buildNumber`, Android `versionCode`) auto-increments on every production build.
- **App version** (`1.0.0` in `app.json`) is managed by you — bump manually in `app.json` when releasing a new user-facing version.

To set the version remotely:
```bash
eas build:version:set --platform ios --profile production
eas build:version:set --platform android --profile production
```

---

## Run expo-doctor

```bash
npx expo-doctor
```

Fix any warnings before submitting. Common ones:
- Missing native modules — run `npx expo install --fix`
- Mismatched peer deps — check the specific package

---

## App Store Connect — Required Before Review

1. **Age Rating** — complete the questionnaire (likely 4+)
2. **Privacy Policy URL** — `https://squashghostingx.com/privacy`
3. **Support URL** — `https://squashghostingx.com/support`
4. **App Description** — 4000 char max
5. **Keywords** — 100 char max, comma-separated
6. **Screenshots** — at minimum iPhone 6.7" (1290×2796 px)
7. **iPad Screenshots** — required (`supportsTablet: true`)
8. **Export Compliance** — `ITSAppUsesNonExemptEncryption: false` is already set in `app.json` → select **No** in the questionnaire
9. **Content Rights** — confirm you own all content

---

## Google Play Console — Required Before Review

1. **Store listing** — title, short description (80 chars), full description (4000 chars)
2. **Feature graphic** — 1024×500 px
3. **Screenshots** — min 2 phone screenshots
4. **Content rating** — complete IARC questionnaire
5. **Data safety** — declare: no data collected/shared (all local storage)
6. **Target audience** — 18+
7. **App category** — Health & Fitness
8. **Privacy Policy URL** — `https://squashghostingx.com/privacy`

---

## Full First-Release Checklist

- [x] `ascAppId` (6749510678) and `appleTeamId` (X5WPU3FJ39) already set in `eas.json`
- [ ] Download `google-play-key.json` service account key → project root
- [ ] Verify `assets/icon.png` is 1024×1024 PNG with no transparency
- [ ] Verify `assets/adaptive-icon.png` is 1024×1024 PNG with adequate padding
- [ ] Run `eas login` (with sunilgahlot@gmail.com) to authenticate EAS CLI
- [ ] Run `eas build --platform all --profile production`
- [ ] Create App Store Connect listing + upload screenshots
- [ ] Create Google Play listing + upload feature graphic + screenshots
- [ ] Run `eas submit --platform android --profile production`
- [ ] Run `eas submit --platform ios --profile production`
- [ ] Submit iOS build for App Review
- [ ] Promote Android build from internal → production in Play Console

---

## Troubleshooting

**"No bundle identifier found"**
→ Check `ios.bundleIdentifier` in `app.json` matches exactly what's in App Store Connect.

**Android build fails with minSdkVersion error**
→ `expo-build-properties` plugin in `app.json` sets `minSdkVersion: 24`. Ensure all native modules support API 24+.

**iOS build fails: "No provisioning profile"**
→ Run `eas credentials` and let EAS auto-manage credentials, or manually upload certificates.

**`eas submit` fails: "Invalid service account key"**
→ Re-download the JSON key from Google Cloud Console. Ensure the service account has Release Manager role in Play Console.

**Build number not incrementing**
→ `autoIncrement: true` only increments when a build completes successfully on EAS servers. Local builds do not increment.

**expo-doctor shows peer dependency warnings**
→ Run `npx expo install --fix` to align all Expo SDK packages to compatible versions.

---

## Configuration Summary

| Setting | Value |
|---|---|
| Bundle ID / Package | `com.squashghostingx.app` |
| App Version | `1.0.0` (bump in `app.json` for each release) |
| iOS Min Version | 16.0 |
| Android Min SDK | 24 (Android 7.0) |
| Android Target SDK | 35 (Android 15) |
| New Architecture | Enabled |
| OTA Updates Channel | `production` |
| Apple ID (email) | `sunilgahlot@gmail.com` |
| Contact Email | `squash.ghostingx@gmail.com` |
| Privacy Policy | `https://squashghostingx.com/privacy` |
| Support Page | `https://squashghostingx.com/support` |
