import { CSSProperties, ReactNode } from 'react';
import styles from './Card.module.css';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={styles.card} style={style}>
      {children}
    </div>
  );
}
