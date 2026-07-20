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
  timeStatus = 'normal',
}: {
  emoji?: string;
  label: string;
  done: boolean;
  onToggle: () => void;
  subtitle?: string;
  rightActions?: ReactNode;
  onLongPress?: () => void;
  onLabelPress?: () => void;
  timeStatus?: 'live' | 'overdue' | 'normal';
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
        <div className={[
          styles.box,
          done && styles.boxDone,
          !done && timeStatus === 'live' && styles.boxLive,
          !done && timeStatus === 'overdue' && styles.boxOverdue
        ].filter(Boolean).join(' ')}>
          {done ? <span style={{ color: 'var(--color-on-primary)', fontSize: 11, fontWeight: 700 }}>✓</span> : null}
        </div>
      </button>
      <button onClick={onLabelPress} className={styles.mainRow} type="button" suppressHydrationWarning>
        {emoji ? <CategoryIcon icon={emoji} size={16} /> : null}
        <span className={styles.textCol}>
          <span className={[styles.label, done && styles.labelDone].filter(Boolean).join(' ')}>
            {label}
            {!done && timeStatus === 'live' && (
              <span style={{
                marginLeft: 8,
                backgroundColor: '#10b91bff',
                color: '#ffffff',
                fontSize: 9,
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                display: 'inline-block',
                verticalAlign: 'middle',
                letterSpacing: '0.05em',
                animation: 'pulse 2s infinite'
              }}>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes pulse {
                    0% { opacity: 0.8; }
                    50% { opacity: 1; }
                    100% { opacity: 0.8; }
                  }
                `}} />
                OnGoing
              </span>
            )}
          </span>
          {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        </span>
      </button>
      {rightActions ? <div className={styles.actions}>{rightActions}</div> : null}
    </div>
  );
}
