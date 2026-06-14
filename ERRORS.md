# SquashGhostingX — Error Log

_Paste errors here with the exact fix so we never solve the same problem twice._

---

## ERR-001 — Edit tool: old_string mismatch in SessionModal.tsx
**When:** Phase 8, editing ActiveTrainingView HUD section  
**Error:** Edit tool failed — old_string did not match (different comment spacing in file)  
**Fix:** Read the file at the exact offset first (`Read` with `offset:` param), copy the exact text character-for-character, then use that as old_string  
**Prevention:** Always Read the exact section before editing large files

---

## ERR-002 — TypeScript: `ReturnType<typeof useSQLiteContext>` in queries.ts
**When:** Phase 6, three query functions  
**Error:** `useSQLiteContext` was never imported — TS error on the return type annotation  
**Fix:** Replace `ReturnType<typeof useSQLiteContext>` with `SQLiteDatabase` (already imported from expo-sqlite)  
**Prevention:** Don't use `ReturnType<typeof hook>` — use the actual type name directly

---

## ERR-003 — expo-keep-awake not available in locked stack
**When:** Phase 6, trying to keep screen on during session  
**Error:** `expo-keep-awake` is not installed and cannot be added  
**Fix:** Use `expo-brightness` (already in stack) — set brightness to 1.0 on session start, restore on end  
**Prevention:** Check locked stack before reaching for a package. Stack is: expo-sqlite, expo-speech, expo-av, expo-haptics, expo-brightness, zustand, react-native-svg, reanimated, gesture-handler, react-navigation

---

## ERR-004 — Reference images inaccessible via Read tool
**When:** Phase 9, trying to view UI reference images from zip  
**Error:** Read tool couldn't access `/tmp/ui_refs/` path  
**Fix:** Copy files to Windows path first: `c:/Users/sunil/OneDrive/Documents/SquashGhostingX/ui_refs/`  
**Prevention:** Always use full Windows absolute paths for file access on this machine

---

## ERR-005 — Voice gender not affecting speech output
**When:** Phase 12 audit — voiceGender was stored in profile but ignored in speakText calls  
**Root cause:** `speakText(text, rate)` had no voiceGender parameter; `expo-speech` doesn't auto-pick male/female voice  
**Fix:** Added `voiceGender` param to `speakText`. Map to `pitch`: male=0.85, female=1.20. Added `speak()` helper in `useSessionEngine` that auto-injects current config's language + voiceGender. All speakText calls replaced with `speak()`.  
**Prevention:** Always thread voiceGender through to the final speak call, not just to the store.

---

## ERR-006 — Voice patterns were fragmented (3 separate calls per position)
**When:** Phase 12 audit  
**Root cause:** Engine fired position label → shot name → recovery cue as 3 separate `setTimeout` chains. On fast intervals, calls overlapped and pacing felt wrong.  
**Fix:** `buildVoiceCall()` function composes ONE complete phrase per drill type. Only one `setTimeout` fires at T+positionCallMs. Separate haptic still fires at recovery time.  
**Prevention:** Voice calls should always be composed as complete sentences, not assembled mid-flight from multiple timers.

---

_Add new errors below as they occur_
