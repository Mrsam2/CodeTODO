import React from 'react';

export function CategoryIcon({ icon, size = 16 }: { icon?: string; size?: number }) {
  if (!icon) return null;
  const cleaned = icon.replace(/<\?xml[^?>]*\?>/i, '').trim();
  if (cleaned.startsWith('<svg')) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    );
  }
  return <span style={{ fontSize: size }}>{icon}</span>;
}
