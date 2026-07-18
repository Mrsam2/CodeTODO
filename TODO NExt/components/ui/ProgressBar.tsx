export function ProgressBar({ pct, color = '#14161A' }: { pct: number; color?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        backgroundColor: '#EEEEEC',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
        margin: '8px 0',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 'var(--radius-pill)',
        }}
      />
    </div>
  );
}
