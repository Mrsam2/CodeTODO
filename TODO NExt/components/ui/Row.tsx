import { CSSProperties, ReactNode, MouseEventHandler } from 'react';

export function Row({
  children,
  style,
  className,
  onClick,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div className={className} onClick={onClick} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, ...style }}>
      {children}
    </div>
  );
}
