// PhilFIDA LCMS Custom Tooltip Component
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  isVisible: boolean;
  setVisible: (v: boolean) => void;
}
const TooltipContext = React.createContext<TooltipContextValue>({ isVisible: false, setVisible: () => {} });

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}
export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [isVisible, setVisible] = useState(false);
  return (
    <TooltipContext.Provider value={{ isVisible, setVisible }}>
      <div className="relative inline-block w-full">{children}</div>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children }: { children: React.ReactNode; asChild?: boolean }) {
  const { setVisible } = React.useContext(TooltipContext);
  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      className="inline-block w-full"
    >
      {children}
    </div>
  );
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}
export function TooltipContent({ children, side = 'right', className }: TooltipContentProps) {
  const { isVisible } = React.useContext(TooltipContext);

  const sideClasses = {
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    top:    'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  }[side];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'absolute z-[9999] whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-xl border border-white/10 pointer-events-none',
        sideClasses,
        className
      )}
    >
      {children}
    </div>
  );
}
