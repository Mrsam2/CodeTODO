import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

export function useColorScheme(): 'light' | 'dark' {
  const themeMode = useAppStore((s) => s.settings.themeMode);
  const systemScheme = useRNColorScheme();

  if (themeMode === 'dark') return 'dark';
  if (themeMode === 'light') return 'light';

  return systemScheme === 'dark' ? 'dark' : 'light';
}
