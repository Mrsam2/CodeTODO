import { ReactNode } from 'react';
import styles from './Modal.module.css';

export function Modal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close" suppressHydrationWarning>
              ✕
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
