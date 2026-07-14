import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Typography } from '@/constants/theme';

type ThemedTextProps = TextProps & {
  type?: 'default' | 'small' | 'smallBold' | 'title' | 'body' | 'bodyBold' | 'heading';
  themeColor?: 'text' | 'textSecondary';
};

export function ThemedText({
  type = 'default',
  themeColor = 'text',
  style,
  ...props
}: ThemedTextProps) {
  const colors = useTheme();
  const textStyle = type === 'small' ? Typography.small
    : type === 'smallBold' ? Typography.smallBold
    : type === 'title' ? Typography.title
    : type === 'body' ? Typography.body
    : type === 'bodyBold' ? Typography.bodyBold
    : type === 'heading' ? Typography.heading
    : {};

  return (
    <Text
      {...props}
      style={[
        textStyle,
        { color: colors[themeColor] },
        style,
      ]}
    />
  );
}
