import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/layout';

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface PillSelectorProps {
  options: Option[];
  selected: string | string[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  scrollable?: boolean;
  wrap?: boolean;
  size?: 'sm' | 'md';
}

export default function PillSelector({
  options, selected, onSelect, multiSelect, scrollable, wrap, size = 'md',
}: PillSelectorProps) {
  const isSelected = (value: string) =>
    Array.isArray(selected) ? selected.includes(value) : selected === value;

  const pills = options.map((opt) => {
    const active = isSelected(opt.value);
    return (
      <TouchableOpacity
        key={opt.value}
        onPress={() => onSelect(opt.value)}
        activeOpacity={0.75}
        style={[
          styles.pill,
          size === 'sm' && styles.pillSm,
          active ? styles.pillActive : styles.pillInactive,
        ]}
      >
        <Text style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          active ? styles.labelActive : styles.labelInactive,
        ]}>
          {opt.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {pills}
      </ScrollView>
    );
  }
  if (wrap) {
    return <View style={styles.wrapFlow}>{pills}</View>;
  }
  return <View style={styles.wrap}>{pills}</View>;
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base },
  wrap:     { flexDirection: 'row', flexWrap: 'nowrap', flexShrink: 0, gap: Spacing.sm },
  wrapFlow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  pillSm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  pillActive: { backgroundColor: Colors.brandMuted, borderColor: Colors.brand },
  pillInactive: { backgroundColor: Colors.surface, borderColor: Colors.border },
  label: { fontSize: FontSize.label, fontWeight: FontWeight.semiBold },
  labelSm: { fontSize: FontSize.caption },
  labelActive: { color: Colors.brand, fontWeight: FontWeight.bold as any },
  labelInactive: { color: Colors.textSecondary },
});
