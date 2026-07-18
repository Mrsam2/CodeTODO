import styles from './DateStrip.module.css';

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
  return (
    <div className={styles.row}>
      {days.map((d) => (
        <button
          key={d.key}
          onClick={() => onSelect(d.key)}
          className={[styles.day, d.isSelected && styles.dayActive].filter(Boolean).join(' ')}
          suppressHydrationWarning
        >
          <span className={[styles.dayLabel, d.isSelected && styles.dayLabelActive].filter(Boolean).join(' ')}>
            {d.dayLabel}
          </span>
          <span className={[styles.dateLabel, d.isSelected && styles.dateLabelActive].filter(Boolean).join(' ')}>
            {d.dateLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
