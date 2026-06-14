import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius, ButtonHeight } from '../../constants/layout';
import { useSessionStore } from '../../stores/sessionStore';
import { deleteCheckpoint } from '../../db/queries';

export default function ResumePromptModal() {
  const db = useSQLiteContext() as any;
  const { pendingCheckpoint, setPendingCheckpoint, setPendingConfig } = useSessionStore();

  if (!pendingCheckpoint) return null;

  const cp    = pendingCheckpoint;
  const saved = new Date(cp.savedAt);
  const ago   = Math.round((Date.now() - saved.getTime()) / 60_000);
  const agoStr = ago < 60 ? `${ago} min ago` : `${Math.round(ago / 60)} hr ago`;

  const totalSecs = cp.config.duration * 60;
  const pct = Math.round((cp.elapsedSeconds / totalSecs) * 100);
  const mm = String(Math.floor(cp.elapsedSeconds / 60)).padStart(2, '0');
  const ss = String(cp.elapsedSeconds % 60).padStart(2, '0');

  function handleResume() {
    // Restore session config — session engine will handle checkpoint restoration
    setPendingConfig(cp.config);
    setPendingCheckpoint(null);
  }

  function handleDiscard() {
    deleteCheckpoint(db).catch(() => {});
    setPendingCheckpoint(null);
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.iconRow}>
              <Text style={styles.icon}>⏱</Text>
            </View>
            <Text style={styles.title}>Unfinished Session</Text>
            <Text style={styles.sub}>You left a session in progress.</Text>

            {/* Session detail */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Drill</Text>
                <Text style={styles.infoValue}>
                  {cp.config.drillType.replace('-', ' ')} · {cp.config.courtSystem.toUpperCase()}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Progress</Text>
                <Text style={styles.infoValue}>{mm}:{ss} · {pct}% done</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Saved</Text>
                <Text style={styles.infoValue}>{agoStr}</Text>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity onPress={handleResume} style={styles.resumeBtn}>
              <Text style={styles.resumeText}>▶  Resume Session</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
              <Text style={styles.discardText}>Start Fresh</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  iconRow:  { alignItems: 'center', marginBottom: Spacing.sm },
  icon:     { fontSize: 44 },
  title:    { fontSize: FontSize.title, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  sub:      { fontSize: FontSize.label, color: Colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xl },
  infoCard: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.xl, overflow: 'hidden',
  },
  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  infoLabel:{ fontSize: FontSize.label, color: Colors.textMuted },
  infoValue:{ fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, textTransform: 'capitalize' },
  divider:  { height: 1, backgroundColor: Colors.border },
  resumeBtn: {
    height: ButtonHeight.xl, backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  resumeText:  { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  discardBtn: {
    height: ButtonHeight.md, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  discardText: { fontSize: FontSize.label, color: Colors.textMuted },
});
