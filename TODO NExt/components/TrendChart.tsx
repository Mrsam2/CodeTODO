'use client';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayName(dateStr: string): string {
  // dateStr can be "MM-DD" or "YYYY-MM-DD"
  const parts = dateStr.split('-');
  let d: Date;
  if (parts.length === 2) {
    const now = new Date();
    d = new Date(now.getFullYear(), parseInt(parts[0]) - 1, parseInt(parts[1]));
  } else {
    d = new Date(dateStr);
  }
  return DAY_NAMES[d.getDay()] ?? dateStr;
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const todayMD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayFull = now.toISOString().slice(0, 10);
  return dateStr === todayMD || dateStr === todayFull;
}

export function TrendChart({ data, height = 120 }: TrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
      {/* Bars area */}
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          padding: '0 4px',
          borderBottom: '1.5px solid var(--color-border)',
        }}
      >
        {data.map((d, i) => {
          const pct = d.value / maxValue;
          const barH = Math.max(pct * (height - 4), d.value > 0 ? 4 : 0);
          const today = isToday(d.date);
          const active = d.value > 0;

          return (
            <div
              key={i}
              title={`${d.value}%`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                gap: 2,
              }}
            >
              {/* Value label on top of bar */}
              <span
                style={{
                  fontSize: 9,
                  color: active ? 'var(--color-primary)' : 'transparent',
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 2,
                }}
              >
                {active ? `${d.value}%` : ''}
              </span>

              {/* The bar */}
              <div
                style={{
                  width: '100%',
                  height: barH,
                  borderRadius: '4px 4px 0 0',
                  background: today
                    ? 'linear-gradient(180deg, #a78bfa 0%, #6d28d9 100%)'
                    : active
                    ? 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)'
                    : 'var(--color-border)',
                  opacity: active ? 1 : 0.4,
                  transition: 'height 0.3s ease',
                  minHeight: 3,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day name labels */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 6,
          padding: '5px 4px 0',
        }}
      >
        {data.map((d, i) => {
          const today = isToday(d.date);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 10,
                fontWeight: today ? 800 : 500,
                color: today ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {getDayName(d.date)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
