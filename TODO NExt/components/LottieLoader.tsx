'use client';

import Lottie from 'lottie-react';
import loadingAnimation from '@/public/Successful target.json';

export function LottieLoader({ size = 180, text = 'Loading...', fullScreen = false }: { size?: number; text?: string; fullScreen?: boolean }) {
  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#0B0C0E', // Match App background color
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '220px',
    padding: '24px',
    width: '100%',
    height: '100%',
  };

  return (
    <div style={containerStyle}>
      <div style={{ width: size, height: size }}>
        <Lottie animationData={loadingAnimation} loop={true} autoplay={true} />
      </div>
      {text && (
        <span style={{
          marginTop: 12,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.05em',
        }}>
          {text}
        </span>
      )}
    </div>
  );
}
