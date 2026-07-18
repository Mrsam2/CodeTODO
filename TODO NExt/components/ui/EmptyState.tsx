export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-5) 0',
        gap: 'var(--spacing-2)',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 'var(--font-size-title)', fontWeight: 700, color: 'var(--color-text)' }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
