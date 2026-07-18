import { ReactNode } from 'react';
import { CategoryIcon } from '../CategoryIcon';
import styles from './CheckRow.module.css';

export function CheckRow({
  emoji,
  label,
  done,
  onToggle,
  subtitle,
  rightActions,
  onLabelPress,
}: {
  emoji?: string;
  label: string;
  done: boolean;
  onToggle: () => void;
  subtitle?: string;
  rightActions?: ReactNode;
  onLongPress?: () => void;
  onLabelPress?: () => void;
}) {
  return (
    <div className={styles.row}>
      <button
        onClick={onToggle}
        className={styles.boxPressable}
        role="checkbox"
        aria-checked={done}
        suppressHydrationWarning
      >
        <div className={[styles.box, done && styles.boxDone].filter(Boolean).join(' ')}>
          {done ? <span style={{ color: 'var(--color-on-primary)', fontSize: 11, fontWeight: 700 }}>✓</span> : null}
        </div>
      </button>
      <button onClick={onLabelPress} className={styles.mainRow} type="button" suppressHydrationWarning>
        {emoji ? <CategoryIcon icon={emoji} size={16} /> : null}
        <span className={styles.textCol}>
          <span className={[styles.label, done && styles.labelDone].filter(Boolean).join(' ')}>{label}</span>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </span>
      </button>
      {rightActions ? <div className={styles.actions}>{rightActions}</div> : null}
    </div>
  );
}
