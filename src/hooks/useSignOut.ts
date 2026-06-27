import { InteractionManager } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

import { useProfileStore } from '../stores/profileStore';
import { useProgressStore } from '../stores/progressStore';
import { useBadgesStore } from '../stores/badgesStore';
import { useSessionStore } from '../stores/sessionStore';

/**
 * Single source of truth for signing out.
 * Clears SecureStore credentials, wipes all SQLite training data,
 * resets in-memory progress/badge caches, then resets auth state.
 * Settings are intentionally kept — they are device-level preferences.
 */
export function useSignOut() {
  const db         = useSQLiteContext();
  const signOut    = useProfileStore((s) => s.signOut);
  const clearCache = useProgressStore((s) => s.clearCache);

  return async function performSignOut() {
    // 1. Wipe credentials from secure storage
    await SecureStore.deleteItemAsync('sgx-user-credentials').catch(() => {});
    await SecureStore.deleteItemAsync('sgx-auth-attempts').catch(() => {});

    // 2. Delete all training data so the next user starts fresh
    try {
      await db.execAsync(
        'DELETE FROM movements; DELETE FROM personal_bests; DELETE FROM checkpoints; DELETE FROM sessions;'
      );
    } catch {}

    // 3. Clear in-memory caches and dismiss any active/complete session
    clearCache();
    useBadgesStore.getState().resetBadges();
    useSessionStore.getState().endSession();

    // 4. Reset auth/profile state after any active animations settle
    InteractionManager.runAfterInteractions(() => {
      signOut();
    });
  };
}
