import styles from './SegmentedControl.module.css';

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className={styles.track}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={[styles.item, active && styles.itemActive].filter(Boolean).join(' ')}
            suppressHydrationWarning
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
