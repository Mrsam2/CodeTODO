'use client';

import { useState } from 'react';
import { Button, Card, Input, Row, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsPage() {
  const store = useAppStore();
  const [granularity, setGranularity] = useState(String(store.settings.slotGranularityMins));
  const [gracePeriod, setGracePeriod] = useState(String(store.settings.gracePeriodMins));
  const [streakTarget, setStreakTarget] = useState(String(store.settings.streakTargetPct));
  const [backendUrl, setBackendUrl] = useState(store.settings.aiBackendUrl);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(store.settings.themeMode || 'system');

  // Passkey states
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyError(null);
    setPasskeySuccess(null);
    const deviceName = navigator.userAgent.includes('Mobile') ? 'My Mobile Device' : 'My Desktop PC';
    const err = await store.registerPasskey(deviceName);
    setPasskeyLoading(false);
    if (err) {
      setPasskeyError(err);
    } else {
      setPasskeySuccess('Passkey registered successfully on this device!');
    }
  };

  const save = () => {
    store.updateSettings({
      slotGranularityMins: Number(granularity) || 30,
      gracePeriodMins: Number(gracePeriod) || 30,
      streakTargetPct: Number(streakTarget) || 80,
      aiBackendUrl: backendUrl,
      themeMode,
    });
  };

  const exportData = () => {
    const data = {
      categories: store.categories,
      roadmapNodes: store.roadmapNodes,
      todos: store.todos,
      dayPlans: store.dayPlans,
      notes: store.notes,
      savedLinks: store.savedLinks,
      futureIdeas: store.futureIdeas,
      shiftLogs: store.shiftLogs,
      settings: store.settings,
    };
    const json = JSON.stringify(data, null, 2);
    console.log('Export data:', json);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Settings" />

      {store.user ? (
        <Card>
          <span style={{ fontWeight: 700 }}>Account Settings</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Logged in as: {store.user.email}
          </span>

          <Row style={{ gap: 8 }}>
            <Button title={store.isSyncing ? 'Syncing...' : 'Sync Now'} onPress={() => store.syncWithCloud()} disabled={store.isSyncing} />
            <Button title="Sign Out" onPress={() => store.logout()} variant="ghost" />
          </Row>
          {store.lastSyncAt ? (
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
              Last cloud sync: {new Date(store.lastSyncAt).toLocaleString()}
            </span>
          ) : null}

          <div style={{ margin: '12px 0 0 0', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 2 }}>Device Security (Passkeys)</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
              Register a passkey to instantly sign in on this device using fingerprint, face ID, or PIN.
            </span>
            {passkeyError && <span style={{ color: 'var(--color-error)', fontSize: 11, display: 'block', marginBottom: 6 }}>⚠️ {passkeyError}</span>}
            {passkeySuccess && <span style={{ color: 'var(--color-success)', fontSize: 11, display: 'block', marginBottom: 6 }}>✨ {passkeySuccess}</span>}
            <Button
              small
              variant="secondary"
              title={passkeyLoading ? 'Registering...' : '🔑 Register Passkey on this device'}
              onPress={handleRegisterPasskey}
              disabled={passkeyLoading}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Timetable Granularity (minutes)</span>
        <Input value={granularity} onChangeText={setGranularity} placeholder="30" keyboardType="numeric" />
      </Card>

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Grace Period (minutes)</span>
        <Input value={gracePeriod} onChangeText={setGracePeriod} placeholder="30" keyboardType="numeric" />
      </Card>

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Streak Target (%)</span>
        <Input value={streakTarget} onChangeText={setStreakTarget} placeholder="80" keyboardType="numeric" />
      </Card>

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>AI Backend URL</span>
        <Input value={backendUrl} onChangeText={setBackendUrl} placeholder=" " />
      </Card>

      <Card>
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>App Theme Mode</span>
        <Row style={{ gap: 8 }}>
          {(['system', 'light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              style={{
                flex: 1,
                height: 40,
                border: `1.5px solid ${themeMode === mode ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: themeMode === mode ? 'var(--color-primary)' : 'var(--color-surface)',
                color: themeMode === mode ? 'var(--color-on-primary)' : 'var(--color-text)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {mode}
            </button>
          ))}
        </Row>
      </Card>

      <Card>
        <Row style={{ gap: 8 }}>
          <Button title="Save Settings" onPress={save} />
          <Button title="Export Data" onPress={exportData} variant="secondary" />
        </Row>
      </Card>
    </div>
  );
}
