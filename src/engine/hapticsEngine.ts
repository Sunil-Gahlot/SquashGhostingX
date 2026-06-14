import * as Haptics from 'expo-haptics';

// Each function is a named event — call from session engine at the right moment.
// All wrapped in .catch(() => {}) so haptics never crash the session.

/** T+0ms: preparation signal before each position call */
export function onPositionCall(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** T+0ms: heavy impact used in beep-only mode — the haptic IS the beep signal */
export function onPositionCallBeep(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
}

/** After recovery cue: player should be back at T */
export function onReturnToT(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Countdown 3-2-1 ticks */
export function onCountdownTick(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
}

/** "GO!" — session transitions to active */
export function onSessionStart(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Rest period begins */
export function onRestStart(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

/** Rest period ends, active resumes */
export function onRestEnd(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Session completed naturally */
export function onSessionComplete(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Session abandoned mid-session */
export function onSessionAbandoned(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
