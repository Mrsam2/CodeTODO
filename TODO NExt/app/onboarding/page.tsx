'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/lib/dates';

export default function OnboardingPage() {
  const router = useRouter();
  const store = useAppStore();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [studyTime, setStudyTime] = useState('60');
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!categoryName.trim()) return;
    setLoading(true);

    try {
      store.addCategory({
        name: categoryName.trim(),
        description: description.trim(),
        color: '#2563EB',
        icon: '📘',
        targetPacePerDayMins: Number(studyTime) || 60,
      });

      const latestCategory = useAppStore.getState().categories.slice(-1)[0];
      if (latestCategory) {
        store.generateAndImportRoadmap(latestCategory.id).catch((err) => {
          console.warn('Onboarding roadmap generation failed:', err);
        });
      }

      const today = todayISO();
      store.ensureDayPlan(today);

      store.updateSettings({ onboardingComplete: true });

      router.replace('/');
    } catch (e) {
      console.warn('Failed to generate onboarding roadmap:', e);
      store.updateSettings({ onboardingComplete: true });
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: '#FFFFFF',
            alignSelf: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            boxShadow: '0 6px 16px rgba(20,22,26,0.08)',
            fontSize: 40,
          }}
        >
          ✅
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800, color: 'var(--color-text)' }}>Welcome to My Day!</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>A simple, joyful way to take control of your time and routines</span>
        </div>

        <Card>
          <Input value={categoryName} onChangeText={setCategoryName} placeholder="e.g. DSA, English Speaking…" editable={!loading} />
          <Input value={description} onChangeText={setDescription} placeholder="What do you want to achieve?" multiline editable={!loading} />
          <Input value={studyTime} onChangeText={setStudyTime} placeholder="Minutes per day" keyboardType="numeric" editable={!loading} />

          {loading ? (
            <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Gemini is building your learning roadmap...</span>
            </div>
          ) : (
            <Button title="Get Started" onPress={start} disabled={!categoryName.trim()} />
          )}
        </Card>
      </div>
    </div>
  );
}
