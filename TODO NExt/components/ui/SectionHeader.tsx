import { CSSProperties, ReactNode } from 'react';
import styles from './SectionHeader.module.css';

export function SectionHeader({
  title,
  right,
  style,
}: {
  title: string;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={styles.header} style={style}>
      <span className={styles.title}>{title}</span>
      {right}
    </div>
  );
}
