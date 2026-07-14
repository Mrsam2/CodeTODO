import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, Row } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { todayISO } from '@/lib/dates';

export default function OnboardingScreen() {
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

      // Fetch the newly added category's ID
      const latestCategory = useAppStore.getState().categories.slice(-1)[0];
      if (latestCategory) {
        store.generateAndImportRoadmap(latestCategory.id).catch((err) => {
          console.warn('Onboarding roadmap generation failed:', err);
        });
      }

      const today = todayISO();
      store.ensureDayPlan(today);

      store.updateSettings({
        onboardingComplete: true,
      });

      router.replace('/(tabs)');
    } catch (e) {
      console.warn('Failed to generate onboarding roadmap:', e);
      // Proceed anyway so onboarding completes even on API errors
      store.updateSettings({ onboardingComplete: true });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <ThemedText style={{ fontSize: 40 }}>✅</ThemedText>
        </View>

        <View style={{ gap: Spacing.two, marginBottom: Spacing.four, alignItems: 'center' }}>
          <ThemedText type="heading" style={{ textAlign: 'center' }}>
            Welcome to My Day!
          </ThemedText>
          <ThemedText
            type="body"
            themeColor="textSecondary"
            style={{ textAlign: 'center' }}
          >
            A simple, joyful way to take control of your time and routines
          </ThemedText>
        </View>

        <Card>
          <Input
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="e.g. DSA, English Speaking…"
            editable={!loading}
          />
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="What do you want to achieve?"
            multiline
            editable={!loading}
          />
          <Input
            value={studyTime}
            onChangeText={setStudyTime}
            placeholder="Minutes per day"
            keyboardType="numeric"
            editable={!loading}
          />

          {loading ? (
            <View style={{ paddingVertical: Spacing.two, alignItems: 'center', gap: Spacing.one }}>
              <ActivityIndicator size="small" color="#14161A" />
              <ThemedText type="small" themeColor="textSecondary">
                Gemini is building your learning roadmap...
              </ThemedText>
            </View>
          ) : (
            <Button
              title="Get Started"
              onPress={start}
              disabled={!categoryName.trim()}
            />
          )}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.two, flex: 1, justifyContent: 'center' },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    shadowColor: '#14161A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
});
