import { CSSProperties } from 'react';
import styles from './Input.module.css';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  style?: CSSProperties;
  editable?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
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
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
}: InputProps) {
  const inputMode = keyboardType === 'numeric' ? 'numeric' : keyboardType === 'email-address' ? 'email' : 'text';
  const className = [styles.input, multiline && styles.multiline].filter(Boolean).join(' ');

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={!editable}
        rows={numberOfLines}
        className={className}
        style={style}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect === false ? 'off' : 'on'}
        suppressHydrationWarning
      />
    );
  }

  return (
    <input
      type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text'}
      inputMode={inputMode as 'text' | 'numeric' | 'email'}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      disabled={!editable}
      className={className}
      style={style}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect === false ? 'off' : 'on'}
      suppressHydrationWarning
    />
  );
}
