import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Spacing, Colors, Typography, Radii, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  small?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  small = false,
  style,
}: ButtonProps) {
  const colors = useTheme();
  const variantStyle =
    variant === 'primary'
      ? {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        }
      : variant === 'secondary'
        ? {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.surfaceMuted,
        }
        : {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variantStyle,
        small && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: variant === 'primary' ? colors.onPrimary : colors.text },
          small && styles.buttonTextSmall,
          disabled && { opacity: 0.5 },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const colors = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: Radii.lg,
          padding: Spacing.three,
          gap: Spacing.two,
        },
        Shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  style?: TextStyle;
  editable?: boolean;
  numberOfLines?: number;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style,
  editable = true,
  numberOfLines,
}: InputProps) {
  const colors = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      numberOfLines={numberOfLines}
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 0,
          borderRadius: Radii.md,
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.two + 2,
          color: colors.text,
          fontSize: 14,
          minHeight: multiline ? 100 : 44,
        },
        style,
      ]}
    />
  );
}

interface ChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, color, selected = false, onPress }: ChipProps) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.one + 2,
          borderRadius: Radii.pill,
          backgroundColor: selected ? (color || colors.primary) : colors.surfaceMuted,
          marginRight: Spacing.one,
          marginBottom: Spacing.one,
        },
      ]}
    >
      <Text
        style={[
          { color: selected ? '#FFF' : colors.text, fontSize: 12, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface ProgressBarProps {
  pct: number;
  color?: string;
}

export function ProgressBar({ pct, color = '#14161A' }: ProgressBarProps) {
  return (
    <View
      style={{
        width: '100%',
        height: 6,
        backgroundColor: '#EEEEEC',
        borderRadius: Radii.pill,
        overflow: 'hidden',
        marginVertical: Spacing.two,
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: Radii.pill,
        }}
      />
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, right, style }: SectionHeaderProps) {
  const colors = useTheme();
  return (
    <View
      style={[{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.two,
        paddingHorizontal: Spacing.one,
      }, style]}
    >
      <Text style={[Typography.title, { color: colors.text }]}>{title}</Text>
      {right}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  const colors = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.five,
        gap: Spacing.two,
      }}
    >
      <Text style={[Typography.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.two,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Segmented control — pill tab switcher (e.g. To do / Completed / Pending) ───
interface SegmentedControlProps {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const colors = useTheme();
  return (
    <View style={[seg.track, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              seg.item,
              active && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[seg.label, { color: active ? colors.onPrimary : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radii.pill,
    padding: 4,
    gap: 4,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});

// ─── Horizontal date strip (Mon..Sun) with the selected day as a filled pill ───
interface DateStripDay {
  key: string;
  dayLabel: string;
  dateLabel: string;
  isSelected: boolean;
  isToday: boolean;
}

export function DateStrip({
  days,
  onSelect,
}: {
  days: DateStripDay[];
  onSelect: (key: string) => void;
}) {
  const colors = useTheme();
  return (
    <View style={[dateStrip.row, { backgroundColor: colors.surface }, Shadow.card]}>
      {days.map((d) => (
        <TouchableOpacity
          key={d.key}
          onPress={() => onSelect(d.key)}
          style={[
            dateStrip.day,
            d.isSelected && { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[dateStrip.dayLabel, { color: d.isSelected ? colors.onPrimary : colors.textSecondary }]}>
            {d.dayLabel}
          </Text>
          <Text style={[dateStrip.dateLabel, { color: d.isSelected ? colors.onPrimary : colors.text }]}>
            {d.dateLabel}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const dateStrip = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Radii.lg,
    padding: Spacing.two,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radii.md,
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
});

// ─── Checkbox row — used for simple todo/checklist items in the DailyLoop style ───
export function CheckRow({
  emoji,
  label,
  done,
  onToggle,
  subtitle,
  rightActions,
  onLongPress,
  onLabelPress,
}: {
  emoji?: string;
  label: string;
  done: boolean;
  onToggle: () => void;
  subtitle?: string;
  rightActions?: React.ReactNode;
  onLongPress?: () => void;
  onLabelPress?: () => void;
}) {
  const colors = useTheme();
  if (rightActions) {
    return (
      <View style={check.rowWithActions}>
        <TouchableOpacity onPress={onToggle} style={check.boxPressable} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
          <View
            style={[
              check.box,
              {
                borderColor: done ? colors.primary : colors.border,
                backgroundColor: done ? colors.primary : 'transparent',
              },
            ]}
          >
            {done ? <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLabelPress}
          onLongPress={onLongPress}
          delayLongPress={120}
          style={check.mainRow}
          activeOpacity={onLabelPress ? 0.7 : 1}
        >
          {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                check.label,
                {
                  color: done ? colors.textSecondary : colors.text,
                  textDecorationLine: done ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <View style={check.actions}>{rightActions}</View>
      </View>
    );
  }

  return (
    <View style={check.row}>
      <TouchableOpacity onPress={onToggle} style={check.boxPressable} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
      <View
        style={[
          check.box,
          {
            borderColor: done ? colors.primary : colors.border,
            backgroundColor: done ? colors.primary : 'transparent',
          },
        ]}
      >
        {done ? <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
      </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onLabelPress}
        onLongPress={onLongPress}
        delayLongPress={120}
        style={check.mainRow}
        activeOpacity={onLabelPress ? 0.7 : 1}
      >
        {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
        <View style={{ flex: 1 }}>
          <Text
            style={[
              check.label,
              {
                color: done ? colors.textSecondary : colors.text,
                textDecorationLine: done ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const check = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  boxPressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowWithActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
