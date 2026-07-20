'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Row, SectionHeader, Modal, CategoryIcon } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsPage() {
  const store = useAppStore();
  const [granularity, setGranularity] = useState(String(store.settings.slotGranularityMins));
  const [gracePeriod, setGracePeriod] = useState(String(store.settings.gracePeriodMins));
  const [streakTarget, setStreakTarget] = useState(String(store.settings.streakTargetPct));
  const [backendUrl, setBackendUrl] = useState(store.settings.aiBackendUrl);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(store.settings.themeMode || 'system');
  const [motivationImageUrl, setMotivationImageUrl] = useState(store.settings.motivationImageUrl || '');
  const [motivationSubtext, setMotivationSubtext] = useState(store.settings.motivationSubtext || '');
  const [countdownTarget, setCountdownTarget] = useState(store.settings.countdownTarget || '');
  const [countdownLabel, setCountdownLabel] = useState(store.settings.countdownLabel || '');
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [permanentDeleteConfirmId, setPermanentDeleteConfirmId] = useState<string | null>(null);
  const [permanentDeleteConfirmName, setPermanentDeleteConfirmName] = useState<string>('');

  const deletedCategories = store.categories.filter((c) => c.isDeleted);

  const promptPermanentDelete = (id: string, name: string) => {
    setPermanentDeleteConfirmId(id);
    setPermanentDeleteConfirmName(name);
  };

  const handlePermanentDeleteConfirm = () => {
    if (permanentDeleteConfirmId) {
      store.deleteCategoryPermanently(permanentDeleteConfirmId);
      setPermanentDeleteConfirmId(null);
    }
  };

  // Sync hydrated settings with local states
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGranularity(String(store.settings.slotGranularityMins));
    setGracePeriod(String(store.settings.gracePeriodMins));
    setStreakTarget(String(store.settings.streakTargetPct));
    setBackendUrl(store.settings.aiBackendUrl);
    setThemeMode(store.settings.themeMode || 'system');
    setMotivationImageUrl(store.settings.motivationImageUrl || '');
    setMotivationSubtext(store.settings.motivationSubtext || '');
    setCountdownTarget(store.settings.countdownTarget || '');
    setCountdownLabel(store.settings.countdownLabel || '');
  }, [
    store.settings.slotGranularityMins,
    store.settings.gracePeriodMins,
    store.settings.streakTargetPct,
    store.settings.aiBackendUrl,
    store.settings.themeMode,
    store.settings.motivationImageUrl,
    store.settings.motivationSubtext,
    store.settings.countdownTarget,
    store.settings.countdownLabel,
  ]);

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
      motivationImageUrl,
      motivationSubtext,
      countdownTarget,
      countdownLabel,
    });
    setShowSavedPopup(true);
    setTimeout(() => {
      setShowSavedPopup(false);
    }, 2500);
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
        <span style={{ fontWeight: 700, marginBottom: 4, display: 'block' }}>Hero Motivation Banner</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'block' }}>
          Select a preset motivation image or enter a custom image URL to display as a premium cover on your home screen.
        </span>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
          {[
            { name: 'None', url: '' },
            { name: 'Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop' },
            { name: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop' },
            { name: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop' },
            { name: 'Forest', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop' },
            { name: 'Aesthetic', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop' }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => setMotivationImageUrl(preset.url)}
              style={{
                flexShrink: 0,
                width: 72,
                height: 52,
                borderRadius: 8,
                border: `2px solid ${motivationImageUrl === preset.url ? 'var(--color-primary)' : 'var(--color-border)'}`,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                backgroundColor: 'var(--color-surface-muted)',
                padding: 0
              }}
              type="button"
            >
              {preset.url ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${preset.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                  Default
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: 8,
                textAlign: 'center',
                padding: '2px 0'
              }}>
                {preset.name}
              </div>
            </button>
          ))}
        </div>

        <Input
          value={motivationImageUrl}
          onChangeText={setMotivationImageUrl}
          placeholder="Paste a custom image URL (https://...)"
          style={{ marginBottom: 12 }}
        />

        <span style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block' }}>Motivation Subtext / Quote</span>
        <Input
          value={motivationSubtext}
          onChangeText={setMotivationSubtext}
          placeholder="Enter a motivation quote or progress text (e.g. Let's make progress today!)"
        />
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
        <span style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Hero Countdown Timer</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'block' }}>
          Enter a label and target date-time to display a live countdown timer in your home screen hero banner.
        </span>

        <span style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: 'block' }}>Countdown Label</span>
        <Input
          value={countdownLabel}
          onChangeText={setCountdownLabel}
          placeholder="e.g. Exam Countdown, Project Deadline"
          style={{ marginBottom: 12 }}
        />

        <span style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: 'block' }}>Target Date & Time</span>
        <Input
          value={countdownTarget}
          onChangeText={setCountdownTarget}
          type="datetime-local"
          placeholder="YYYY-MM-DDTHH:MM (e.g. 2026-12-31T23:59)"
        />
      </Card>

      <SectionHeader title="Recycle Bin" />
      <Card>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'block' }}>
          Restore soft-deleted tracks or delete them permanently from here.
        </span>

        {deletedCategories.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'block', padding: '8px 0' }}>
            No deleted tracks in the Recycle Bin.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deletedCategories.map((cat) => (
              <Row key={cat.id} style={{ justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }}>
                <Row style={{ gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CategoryIcon icon={cat.icon || '📘'} size={12} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</span>
                </Row>
                <Row style={{ gap: 6 }}>
                  <Button small title="Restore" variant="secondary" onPress={() => store.restoreCategory(cat.id)} />
                  <Button small title="Delete Forever" style={{ backgroundColor: 'var(--color-error)' }} onPress={() => promptPermanentDelete(cat.id, cat.name)} />
                </Row>
              </Row>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <Row style={{ gap: 8 }}>
          <Button title="Save Settings" onPress={save} />
          <Button title="Export Data" onPress={exportData} variant="secondary" />
        </Row>
      </Card>

      <Modal
        visible={!!permanentDeleteConfirmId}
        onClose={() => setPermanentDeleteConfirmId(null)}
        title="Delete Permanently?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete the track <strong>&quot;{permanentDeleteConfirmName}&quot;</strong>?
            <br /><br />
            This action is irreversible and will permanently delete all associated topics, roadmaps, and timetable slots.
          </span>
          <Row style={{ justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button title="Cancel" variant="secondary" onPress={() => setPermanentDeleteConfirmId(null)} />
            <Button title="Delete Forever" onPress={handlePermanentDeleteConfirm} style={{ backgroundColor: 'var(--color-error)' }} />
          </Row>
        </div>
      </Modal>

      {/* Success Save Popup */}
      {showSavedPopup && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#059669',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: 12,
          fontWeight: 700,
          boxShadow: 'var(--shadow-floating)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
        suppressHydrationWarning
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeInDown {
              from { transform: translate(-50%, -20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}} />
          <span>✨ Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
}
