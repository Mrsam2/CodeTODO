import React from 'react';
import { Platform, TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';

export function AIButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  if (Platform.OS === 'web') {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          .pb-ai-button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 12px 32px;
            border-radius: 999px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.4px;
            background: linear-gradient(180deg, #a67dff 0%, #7a45ff 45%, #5d24ff 100%);
            box-shadow:
              0 0 0 6px rgba(125, 71, 255, 0.12),
              0 10px 30px rgba(98, 43, 255, 0.35),
              inset 0 2px 10px rgba(255, 255, 255, 0.22);
            overflow: hidden;
            isolation: isolate;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .pb-ai-button::before {
            content: "";
            position: absolute;
            inset: 2px;
            border-radius: inherit;
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.22),
              rgba(255, 255, 255, 0.05) 45%,
              rgba(255, 255, 255, 0)
            );
            z-index: 1;
            pointer-events: none;
          }
          .pb-ai-button::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background-image: radial-gradient(
                circle at bottom center,
                rgba(255, 255, 255, 0.42) 0%,
                rgba(255, 255, 255, 0.18) 18%,
                rgba(255, 255, 255, 0.06) 35%,
                transparent 65%
              ),
              radial-gradient(rgba(255, 255, 255, 0.14) 0.8px, transparent 0.8px),
              radial-gradient(rgba(255, 255, 255, 0.08) 0.5px, transparent 0.5px),
              radial-gradient(rgba(0, 0, 0, 0.08) 0.7px, transparent 0.7px);
            background-size: 100% 100%, 4px 4px, 7px 7px, 5px 5px;
            background-position: center, 0 0, 2px 2px, 1px 3px;
            opacity: 0.55;
            mix-blend-mode: overlay;
            z-index: 2;
            pointer-events: none;
          }
          .pb-ai-button span {
            position: relative;
            z-index: 3;
          }
          .pb-ai-sparkle {
            font-size: 14px;
            transform: translateY(-1px);
          }
          .pb-ai-button:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow:
              0 0 0 10px rgba(125, 71, 255, 0.16),
              0 16px 40px rgba(98, 43, 255, 0.42),
              inset 0 2px 10px rgba(255, 255, 255, 0.28);
          }
          .pb-ai-button:active {
            transform: scale(0.98);
          }
          .pb-ai-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
          }
        `}} />
        <button
          className="pb-ai-button"
          onClick={onPress}
          disabled={disabled || loading}
        >
          {loading ? (
            <span>Generating...</span>
          ) : (
            <>
              <span>{title}</span>
              <span className="pb-ai-sparkle">✦</span>
            </>
          )}
        </button>
      </>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.nativeBtn,
        (disabled || loading) && { opacity: 0.6 }
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFF" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.nativeBtnText}>{title}</Text>
          <Text style={styles.nativeBtnSparkle}>✦</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nativeBtn: {
    backgroundColor: '#7a45ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  nativeBtnSparkle: {
    color: '#FFF',
    fontSize: 12,
  }
});
