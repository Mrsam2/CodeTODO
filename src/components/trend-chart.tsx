import React from 'react';
import { View, Dimensions } from 'react-native';
import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
}

export function TrendChart({ data, height = 100, color = '#2563EB' }: TrendChartProps) {
  const colors = useTheme();
  const width = Dimensions.get('window').width - 40;
  const maxValue = Math.max(...data.map((d) => d.value), 100);
  const barWidth = width / Math.max(data.length, 1);

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {data.map((d, i) => (
          <View
            key={i}
            style={{
              width: barWidth - 4,
              height: (d.value / maxValue) * height,
              backgroundColor: color,
              borderRadius: 4,
              opacity: 0.8,
            }}
          />
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.one,
        }}
      >
        {data.length > 0 && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {data[0].date}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {data[data.length - 1].date}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}
