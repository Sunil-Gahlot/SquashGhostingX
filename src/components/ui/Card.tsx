import React from 'react';
import {
  View, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Shadow, Spacing } from '../../constants/layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  accent?: boolean;         // left border accent
  accentColor?: string;
  padding?: number;
}

export default function Card({
  children, style, onPress, elevated, accent, accentColor, padding,
}: CardProps) {
  const containerStyle: ViewStyle[] = [
    styles.base,
    elevated && (Shadow.md as ViewStyle),
    accent && { borderLeftWidth: 3, borderLeftColor: accentColor ?? Colors.primary },
    padding !== undefined && { padding },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
