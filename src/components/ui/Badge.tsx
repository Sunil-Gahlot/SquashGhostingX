import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/layout';
import { SkillLevel } from '../../types';

type BadgeVariant = 'level' | 'streak' | 'pb' | 'zone' | 'tag';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  level?: SkillLevel | 'custom';
  size?: 'sm' | 'md';
}

const LEVEL_COLORS: Record<SkillLevel | 'custom', string> = {
  beginner:     Colors.levelBeginner,
  intermediate: Colors.levelIntermediate,
  advanced:     Colors.levelAdvanced,
  elite:        Colors.levelElite,
  pro:          Colors.levelPro,
  custom:       Colors.textSecondary,
};

export default function Badge({ label, variant = 'tag', level, size = 'sm' }: BadgeProps) {
  let bg: string = Colors.surfaceElevated;
  let fg: string = Colors.textSecondary;
  let borderColor: string = Colors.border;

  if (variant === 'level' && level) {
    const c = LEVEL_COLORS[level];
    bg = `${c}22`;
    fg = c;
    borderColor = `${c}55`;
  } else if (variant === 'streak') {
    bg = `${Colors.flame}22`;
    fg = Colors.flame;
    borderColor = `${Colors.flame}55`;
  } else if (variant === 'pb') {
    bg = `${Colors.gold}22`;
    fg = Colors.gold;
    borderColor = `${Colors.gold}55`;
  } else if (variant === 'zone') {
    bg = Colors.restMuted;
    fg = Colors.rest;
    borderColor = Colors.rest;
  }

  return (
    <View style={[styles.base, size === 'md' && styles.md, { backgroundColor: bg, borderColor }]}>
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: fg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  md: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  text: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  textMd: { fontSize: FontSize.caption },
});
