# SquashGhostingX — Store Submission Package

This folder contains all materials needed to submit SquashGhostingX to the Apple App Store and Google Play Store.

---

## Files in This Folder

| File | Purpose |
|---|---|
| `UAT_REVIEW.md` | Full end-to-end UAT and workflow review — all screens, all flows, all issues found |
| `Pre_Launch_Fixes.md` | **Start here** — prioritised code fixes required before submission |
| `iOS_App_Store_Submission.md` | Complete iOS metadata: description, keywords, screenshots spec, permissions, build commands |
| `Google_Play_Submission.md` | Complete Android metadata: description, data safety, permissions, AAB build commands |
| `Privacy_Policy.md` | Privacy policy template — host this on your website before submitting |

---

## Critical Path to Launch

### Step 1 — Fix blocking issues (~50 min)
See `Pre_Launch_Fixes.md`. Complete all CRITICAL items:
1. Add `bundleIdentifier` + `package` to `app.json`
2. Remove non-functional social auth buttons from auth screen  
3. Remove "PRO" badge from auth welcome screen
4. Replace AsyncStorage credentials with `expo-secure-store`

### Step 2 — Prepare assets (~2–4 hours)
- Screenshot set (6 shots for each platform) — see specs in each store file
- Feature graphic for Google Play (1024×500 px)
- Verify `assets/icon.png` is 1024×1024 PNG, no alpha, no rounded corners

### Step 3 — Host privacy policy
- Customise `Privacy_Policy.md` with your name/company/email/website
- Host the policy at a public URL (GitHub Pages, Notion, or any webpage)
- Update the URL in both store listings and the About section of the app

### Step 4 — Build
```bash
# iOS
eas build --platform ios --profile production

# Android  
eas build --platform android --profile production
```

### Step 5 — Submit
```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## Issue Count Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 Critical (blockers) | 4 | See Pre_Launch_Fixes.md |
| 🟠 Significant | 0 | (included in Critical above) |
| 🟡 Minor | 3 | Easy fixes, see Pre_Launch_Fixes.md |

---

## Store Review Timeline (estimate)

| Store | First submission review | Updates |
|---|---|---|
| Apple App Store | 1–3 business days | 1–2 days |
| Google Play | 3–7 business days | 1–3 days |
