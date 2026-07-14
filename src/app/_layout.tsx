import 'react-native-gesture-handler';
import { Stack, router, useSegments } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppStore } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const runRescheduleNow = useAppStore((s) => s.runRescheduleNow);
  const token = useAppStore((s) => s.token);
  const onboardingCompleteSetting = useAppStore((s) => s.settings.onboardingComplete);
  const categories = useAppStore((s) => s.categories);
  const onboardingComplete = onboardingCompleteSetting || categories.length > 0;
  const segments = useSegments();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Redirect based on auth and onboarding state
  useEffect(() => {
    if (!token) {
      if (segments[0] !== 'auth') {
        router.replace('/auth');
      }
    } else {
      if (segments[0] === 'auth') {
        if (!onboardingComplete) {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        if (!onboardingComplete) {
          if (segments[0] !== 'onboarding') {
            router.replace('/onboarding');
          }
        } else if (segments[0] === 'onboarding') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, onboardingComplete, segments]);

  // Auto-reschedule engine (spec §6.3): on app foreground + every minute.
  useEffect(() => {
    runRescheduleNow();
    const interval = setInterval(() => runRescheduleNow(), 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runRescheduleNow();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [runRescheduleNow]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ title: 'Sign In', headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'Welcome', headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ title: 'Category' }} />
          <Stack.Screen name="node/[id]" options={{ title: 'Topic' }} />
          <Stack.Screen name="study-plan/create" options={{ title: 'Create Study Plan' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
