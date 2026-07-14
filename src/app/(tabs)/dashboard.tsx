import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, ProgressBar, Row, SectionHeader, EmptyState } from '@/components/ui';
import { TrendChart } from '@/components/trend-chart';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/store/useAppStore';
import { trend } from '@/lib/analytics';

export default function DashboardScreen() {
  const colors = useTheme();
  const store = useAppStore();

  const today = store.getTodayStats();
  const streakCount = store.getStreak();
  const reports = store.getCategoryReports();
  const weak = store.getWeaknesses();
  const trendData = trend(store.todos, 7).map((d) => ({
    date: d.date.substring(5),
    value: d.completionPct,
  }));

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Dashboard" />

        <Card>
          <Row style={{ justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <ThemedText type="heading">{today.completionPct}%</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Completion
              </ThemedText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <ThemedText type="heading">{streakCount}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Day Streak
              </ThemedText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <ThemedText type="heading">{today.total}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Todos Today
              </ThemedText>
            </View>
          </Row>
        </Card>

        <SectionHeader title="7-Day Trend" />
        <Card>
          {trendData.length > 0 ? (
            <TrendChart data={trendData} />
          ) : (
            <ThemedText themeColor="textSecondary">No data yet</ThemedText>
          )}
        </Card>

        {reports.length > 0 && (
          <>
            <SectionHeader title="Category Progress" />
            {reports.map((report) => (
              <Card key={report.categoryId}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <ThemedText type="bodyBold">{report.categoryName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {report.doneTodos}/{report.totalTodos}
                  </ThemedText>
                </Row>
                <ProgressBar
                  pct={report.totalTodos > 0 ? Math.round((report.doneTodos / report.totalTodos) * 100) : 0}
                />
              </Card>
            ))}
          </>
        )}

        {weak.length > 0 && (
          <>
            <SectionHeader title="Weaknesses (Need Review)" />
            {weak.map((w) => (
              <Card key={w.categoryId}>
                <Row style={{ justifyContent: 'space-between', marginBottom: Spacing.one }}>
                  <ThemedText type="bodyBold">{w.categoryName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Score: {w.weaknessScore}
                  </ThemedText>
                </Row>
                <ThemedText type="small" themeColor="textSecondary">
                  Shifted or skipped: {w.shiftedOrSkipped} / {w.totalTodos}
                </ThemedText>
              </Card>
            ))}
          </>
        )}

        {reports.length === 0 && (
          <EmptyState title="No data yet" subtitle="Create categories and todos to see analytics" />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 },
});
