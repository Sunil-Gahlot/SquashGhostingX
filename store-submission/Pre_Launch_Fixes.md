# SquashGhostingX — Pre-Launch Fixes
**Status: ALL FIXES APPLIED — 2026-06-08**

---

## Summary

All 7 identified fixes have been applied to the codebase. The app is ready for a production EAS build.

| Fix | File(s) | Priority | Status |
|---|---|---|---|
| 1. Bundle identifiers + permissions | `app.json` | CRITICAL | DONE |
| 2. Remove social auth buttons | `AuthModal.tsx` | CRITICAL | DONE |
| 3. Remove PRO badge | `AuthModal.tsx` | CRITICAL | DONE |
| 4. SecureStore credential encryption | `AuthModal.tsx` | CRITICAL | DONE |
| 5. Login attempt throttling | `AuthModal.tsx` | Security+ | DONE |
| 6. Routines tile navigation | `HomeScreen.tsx` | MINOR | DONE |
| 7. About row info alert | `SettingsScreen.tsx` | MINOR | DONE |

---

## Fix 1 — app.json (Bundle IDs, permissions, build numbers)

**What changed:** Added all production-required fields to `app.json`.

```json
"ios": {
  "bundleIdentifier": "com.squashghostingx.app",   ← ADD / CHANGE TO MATCH EXISTING
  "buildNumber": "1",
  "infoPlist": {
    "UIBackgroundModes": ["audio"],
    "NSPhotoLibraryUsageDescription": "Used to set your profile photo...",
    "NSFaceIDUsageDescription": "Used to secure your login credentials."
  }
},
"android": {
  "package": "com.squashghostingx.app",             ← ADD / CHANGE TO MATCH EXISTING
  "versionCode": 1,
  "targetSdkVersion": 35,
  "permissions": ["android.permission.READ_MEDIA_IMAGES", "android.permission.VIBRATE",
                  "android.permission.FOREGROUND_SERVICE", ...]
}
```

> **ACTION REQUIRED:** If you have an existing app on TestFlight / App Store, replace
> `com.squashghostingx.app` with your **existing bundle identifier** in both iOS and Android
> sections — otherwise EAS will create a new app listing.

---

## Fix 2 — Social auth buttons removed

**File:** `src/screens/auth/AuthModal.tsx`  
**What changed:** `handleSocial()` function deleted; entire `socialGroup` View and its "or continue with email" divider removed from JSX; associated `aStyles` (appleBtn, googleBtn, facebookBtn, etc.) removed from StyleSheet.

Auth screen now shows: tab switcher → email form → guest option. Clean and store-compliant.

---

## Fix 3 — PRO badge removed

**File:** `src/screens/auth/AuthModal.tsx`  
**What changed:** The "PRO" badge View next to the app name in WelcomePage removed from JSX. `wStyles.brandBadge` and `wStyles.brandBadgeText` removed from StyleSheet.

---

## Fix 4 — Credentials migrated to SecureStore

**File:** `src/screens/auth/AuthModal.tsx`  
**Package installed:** `expo-secure-store ~15.0.8`

**Before:** `AsyncStorage.getItem/setItem/removeItem` — plaintext JSON in device storage  
**After:** `SecureStore.getItemAsync/setItemAsync/deleteItemAsync` — iOS Keychain / Android Keystore

All three credential operations updated:
- Register: `setItemAsync` to write email + password
- Login: `getItemAsync` to read and compare
- Forgot Password reset: `deleteItemAsync` to clear

---

## Fix 5 — Login attempt throttling (new security addition)

**File:** `src/screens/auth/AuthModal.tsx`

Added brute-force protection on the Sign In flow:
- Failed attempts stored in SecureStore under key `sgx-auth-attempts`
- After 5 failures: 5-minute lockout with countdown displayed
- Error messages show remaining attempts: "Incorrect email or password. 3 attempts remaining."
- Counter clears on: successful login, successful registration, password reset
- Lockout survives app restart (absolute timestamp stored)

---

## Fix 6 — Routines quick tile navigation

**File:** `src/screens/HomeScreen.tsx`

**Before:** `onPress={openDrillConfig}`  
**After:** `onPress={() => navigation.navigate('Routines')}`

---

## Fix 7 — About row info alert

**File:** `src/screens/SettingsScreen.tsx`

**Before:** `onPress={() => {}}` (silent no-op)  
**After:** Alert showing version 1.0.0, support email, privacy policy URL

> **ACTION REQUIRED:** Replace placeholder `support@squashghostingx.com` and
> `squashghostingx.com/privacy` in SettingsScreen.tsx with your real contact details.

---

## Remaining Actions Before Build

1. **Update bundle ID** if this is an update to an existing App Store listing
2. **Host privacy policy** from `store-submission/Privacy_Policy.md` at a public URL
3. **Replace placeholder URLs** in the About alert (`SettingsScreen.tsx`)
4. **Create screenshots** — see store submission docs for size requirements
5. **Run EAS build** and submit
