import type { Metadata } from 'next';
import './globals.css';
import { StoreHydration } from '@/components/StoreHydration';
import { AuthGate } from '@/components/AuthGate';
import { RescheduleEngine } from '@/components/RescheduleEngine';

export const viewport = {
  themeColor: '#0B0C0E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'My Day',
  description: 'AI-powered day, todo & roadmap OS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'My Day',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script src="https://accounts.google.com/gsi/client" async defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const store = JSON.parse(localStorage.getItem('my-day-store-v1'));
                const theme = store?.state?.settings?.themeMode || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <StoreHydration />
        <RescheduleEngine />
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
