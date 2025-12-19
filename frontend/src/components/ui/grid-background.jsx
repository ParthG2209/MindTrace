import React from 'react';
import { cn } from '../../lib/utils';

export function GridBackground({ className, darkMode = false, ...props }) {
  if (darkMode) {
    // Black Basic Grid Background
    return (
      <div
        className={cn('pointer-events-none fixed inset-0 z-0', className)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          background: '#000000',
          backgroundImage: `
            linear-gradient(to right, rgba(75, 85, 99, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75, 85, 99, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        {...props}
      />
    );
  }

  // Magenta Orb Grid Background (Light Mode)
  return (
    <div
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'white',
        backgroundImage: `
          linear-gradient(to right, rgba(71,85,105,0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(71,85,105,0.15) 1px, transparent 1px),
          radial-gradient(circle at 50% 60%, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.05) 40%, transparent 70%)
        `,
        backgroundSize: '40px 40px, 40px 40px, 100% 100%',
      }}
      {...props}
    />
  );
}