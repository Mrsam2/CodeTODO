'use client';

import { Card, ProgressBar, Row, SectionHeader, EmptyState } from '@/components/ui';
import { TrendChart } from '@/components/TrendChart';
import { useAppStore } from '@/store/useAppStore';
import { trend } from '@/lib/analytics';

export default function DashboardPage() {
  const store = useAppStore();

  const today = store.getTodayStats();
  const streakCount = store.getStreak();
  const reports = store.getCategoryReports();
  const weak = store.getWeaknesses();
  const trendData = trend(store.todos, 7).map((d) => ({ date: d.date.substring(5), value: d.completionPct }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Dashboard" />

      <Card>
        <Row style={{ justifyContent: 'space-around' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>{today.completionPct}%</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Completion</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>{streakCount}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Day Streak</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-heading)', fontWeight: 800 }}>{today.total}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Todos Today</span>
          </div>
        </Row>
      </Card>

      <SectionHeader title="7-Day Trend" />
      <Card>
        {trendData.length > 0 ? <TrendChart data={trendData} /> : <span style={{ color: 'var(--color-text-secondary)' }}>No data yet</span>}
      </Card>

      {reports.length > 0 && (
        <>
          <SectionHeader title="Category Progress" />
          {reports.map((report) => (
            <Card key={report.categoryId}>
              <Row style={{ justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>{report.categoryName}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {report.doneTodos}/{report.totalTodos}
                </span>
              </Row>
              <ProgressBar pct={report.totalTodos > 0 ? Math.round((report.doneTodos / report.totalTodos) * 100) : 0} />
            </Card>
          ))}
        </>
      )}

      {weak.length > 0 && (
        <>
          <SectionHeader title="Weaknesses (Need Review)" />
          {weak.map((w) => (
            <Card key={w.categoryId}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 700 }}>{w.categoryName}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Score: {w.weaknessScore}</span>
              </Row>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Shifted or skipped: {w.shiftedOrSkipped} / {w.totalTodos}
              </span>
            </Card>
          ))}
        </>
      )}

      {reports.length === 0 && <EmptyState title="No data yet" subtitle="Create categories and todos to see analytics" />}
    </div>
  );
}
