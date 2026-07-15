import React from 'react';
import { View, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';

export function CategoryIcon({ icon, size = 16 }: { icon?: string; size?: number }) {
  if (!icon) return null;
  const cleaned = icon.replace(/<\?xml[^?>]*\?>/i, '').trim();
  if (cleaned.startsWith('<svg')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <SvgXml xml={cleaned} width={size} height={size} />
      </View>
    );
  }
  return <Text style={{ fontSize: size }}>{icon}</Text>;
}
