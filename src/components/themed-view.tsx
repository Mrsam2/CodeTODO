import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function ThemedView({ style, ...props }: ViewProps) {
  const colors = useTheme();
  return <View {...props} style={[{ backgroundColor: colors.background }, style]} />;
}
