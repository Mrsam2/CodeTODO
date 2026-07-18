import { CSSProperties } from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  small?: boolean;
  style?: CSSProperties;
}

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  small = false,
  style,
}: ButtonProps) {
  const variantClass =
    variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost;

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={[styles.button, variantClass, small && styles.small, disabled && styles.disabled]
        .filter(Boolean)
        .join(' ')}
      style={style}
      suppressHydrationWarning
    >
      {title}
    </button>
  );
}
