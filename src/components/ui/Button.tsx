import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, BorderRadius, ButtonHeight, Spacing } from '../../constants/layout';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'active';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const BG: Record<Variant, string> = {
  primary:   Colors.brand,
  secondary: Colors.surface,
  ghost:     Colors.transparent,
  danger:    Colors.danger,
  active:    Colors.active,
};

const TEXT_COLOR: Record<Variant, string> = {
  primary:   Colors.textPrimary,
  secondary: Colors.brand,
  ghost:     Colors.brand,
  danger:    Colors.textPrimary,
  active:    Colors.textPrimary,
};

const BORDER_COLOR: Record<Variant, string | undefined> = {
  primary:   undefined,
  secondary: Colors.brand,
  ghost:     Colors.brand,
  danger:    undefined,
  active:    undefined,
};

export default function Button({
  title, onPress, variant = 'primary', size = 'lg',
  disabled, loading, fullWidth, icon, style, textStyle,
}: ButtonProps) {
  const height = ButtonHeight[size];
  const fontSize = size === 'xl' ? FontSize.body + 2 : size === 'lg' ? FontSize.body : size === 'md' ? FontSize.label : FontSize.caption;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        { height, backgroundColor: BG[variant] },
        BORDER_COLOR[variant] && { borderWidth: 1.5, borderColor: BORDER_COLOR[variant] },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_COLOR[variant]} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { fontSize, color: TEXT_COLOR[variant] }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { marginRight: 2 },
  text: {
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
