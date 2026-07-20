'use client';

import React, { createContext, useContext, useState, useRef } from 'react';

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const TooltipCtx = createContext<TooltipContextValue>({ open: false, setOpen: () => {} });

export function TooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <div data-delay={delayDuration}>{children}</div>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipCtx.Provider value={{ open, setOpen }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>{children}</div>
    </TooltipCtx.Provider>
  );
}

export function TooltipTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const { setOpen } = useContext(TooltipCtx);
  const triggerRef = useRef<HTMLDivElement>(null);

  const triggerProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps as React.HTMLAttributes<Element>);
  }

  return (
    <div ref={triggerRef} {...triggerProps}>
      {children}
    </div>
  );
}

export function TooltipContent({
  children,
  side = 'top',
  sideOffset = 6,
}: {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  className?: string;
}) {
  const { open } = useContext(TooltipCtx);
  if (!open) return null;

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  };

  if (side === 'top') {
    positionStyle.bottom = `calc(100% + ${sideOffset}px)`;
    positionStyle.left = '50%';
    positionStyle.transform = 'translateX(-50%)';
  } else if (side === 'bottom') {
    positionStyle.top = `calc(100% + ${sideOffset}px)`;
    positionStyle.left = '50%';
    positionStyle.transform = 'translateX(-50%)';
  } else if (side === 'left') {
    positionStyle.right = `calc(100% + ${sideOffset}px)`;
    positionStyle.top = '50%';
    positionStyle.transform = 'translateY(-50%)';
  } else {
    positionStyle.left = `calc(100% + ${sideOffset}px)`;
    positionStyle.top = '50%';
    positionStyle.transform = 'translateY(-50%)';
  }

  return (
    <div
      style={{
        ...positionStyle,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: '6px 10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        fontSize: 11,
        color: 'var(--color-text)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}
