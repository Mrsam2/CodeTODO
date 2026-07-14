import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, Input, Row, SectionHeader } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const store = useAppStore();
  const colors = useTheme();
  const [granularity, setGranularity] = useState(String(store.settings.slotGranularityMins));
  const [gracePeriod, setGracePeriod] = useState(String(store.settings.gracePeriodMins));
  const [streakTarget, setStreakTarget] = useState(String(store.settings.streakTargetPct));
  const [backendUrl, setBackendUrl] = useState(store.settings.aiBackendUrl);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(store.settings.themeMode || 'system');

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
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Settings" />

        {store.user ? (
          <Card>
            <ThemedText type="bodyBold">Account Settings</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
              Logged in as: {store.user.email}
            </ThemedText>
            
            <Row style={{ gap: Spacing.two }}>
              <Button
                title={store.isSyncing ? 'Syncing...' : 'Sync Now'}
                onPress={() => store.syncWithCloud()}
                disabled={store.isSyncing}
              />
              <Button
                title="Sign Out"
                onPress={() => store.logout()}
                variant="ghost"
              />
            </Row>
            {store.lastSyncAt ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, fontSize: 11 }}>
                Last cloud sync: {new Date(store.lastSyncAt).toLocaleString()}
              </ThemedText>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.two }}>
            Timetable Granularity (minutes)
          </ThemedText>
          <Input
            value={granularity}
            onChangeText={setGranularity}
            placeholder="30"
            keyboardType="numeric"
          />
        </Card>

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.two }}>
            Grace Period (minutes)
          </ThemedText>
          <Input
            value={gracePeriod}
            onChangeText={setGracePeriod}
            placeholder="30"
            keyboardType="numeric"
          />
        </Card>

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.two }}>
            Streak Target (%)
          </ThemedText>
          <Input
            value={streakTarget}
            onChangeText={setStreakTarget}
            placeholder="80"
            keyboardType="numeric"
          />
        </Card>

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.two }}>
            AI Backend URL
          </ThemedText>
          <Input
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://localhost:8787"
          />
        </Card>

        <Card>
          <ThemedText type="bodyBold" style={{ marginBottom: Spacing.two }}>
            App Theme Mode
          </ThemedText>
          <Row style={{ gap: 8 }}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === mode ? colors.primary : colors.surface,
                    borderColor: themeMode === mode ? colors.primary : colors.border,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: themeMode === mode ? '#FFF' : colors.text,
                    fontWeight: '700',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </Row>
        </Card>

        <Card>
          <Row style={{ gap: Spacing.two }}>
            <Button title="Save Settings" onPress={save} />
            <Button title="Export Data" onPress={exportData} variant="secondary" />
          </Row>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
  themeButton: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
