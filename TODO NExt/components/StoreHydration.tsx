'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function StoreHydration() {
  const themeMode = useAppStore((s) => s.settings.themeMode) || 'system';

  useEffect(() => {
    useAppStore.persist.rehydrate();

    // Enforce 3-month session expiration
    const state = useAppStore.getState();
    if (state.token) {
      if (state.sessionExpiresAt && Date.now() > state.sessionExpiresAt) {
        state.logout();
      } else if (!state.sessionExpiresAt) {
        useAppStore.setState({ sessionExpiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000 });
      }
    }

    useAppStore.setState({ hasHydrated: true });

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark') => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(themeMode);
    }
  }, [themeMode]);

  return null;
}
