'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppStore((s) => s.token);
  const onboardingCompleteSetting = useAppStore((s) => s.settings.onboardingComplete);
  const categories = useAppStore((s) => s.categories);
  const onboardingComplete = onboardingCompleteSetting || categories.length > 0;

  useEffect(() => {
    if (!token) {
      if (pathname !== '/auth') {
        router.replace('/auth');
      }
      return;
    }

    if (pathname === '/auth') {
      router.replace(onboardingComplete ? '/' : '/onboarding');
      return;
    }

    if (!onboardingComplete) {
      if (pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    } else if (pathname === '/onboarding') {
      router.replace('/');
    }
  }, [token, onboardingComplete, pathname, router]);

  return <>{children}</>;
}
