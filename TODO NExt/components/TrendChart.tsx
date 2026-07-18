interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  height?: number;
  color?: string;
}

export function TrendChart({ data, height = 100, color = '#2563EB' }: TrendChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: (d.value / maxValue) * height,
              backgroundColor: color,
              borderRadius: 4,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '0 4px' }}>
        {data.length > 0 && (
          <>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{data[0].date}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{data[data.length - 1].date}</span>
          </>
        )}
      </div>
    </div>
  );
}
