import { TabNav } from '@/components/TabNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>{children}</div>
      <TabNav />
    </div>
  );
}
