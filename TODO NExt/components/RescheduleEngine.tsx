'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function RescheduleEngine() {
  const runRescheduleNow = useAppStore((s) => s.runRescheduleNow);

  useEffect(() => {
    runRescheduleNow();
    const interval = setInterval(() => runRescheduleNow(), 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runRescheduleNow();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [runRescheduleNow]);

  return null;
}
