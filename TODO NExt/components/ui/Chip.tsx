import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, color, selected = false, onPress }: ChipProps) {
  return (
    <button
      onClick={onPress}
      className={[styles.chip, selected && styles.chipSelected].filter(Boolean).join(' ')}
      style={{ backgroundColor: selected ? color || 'var(--color-primary)' : undefined }}
      suppressHydrationWarning
    >
      {label}
    </button>
  );
}
