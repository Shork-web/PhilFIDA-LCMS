'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Toaster } from 'sonner';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const isDarkMode = useAuthStore((state) => state.isDarkMode);

  useEffect(() => {
    setMounted(true);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">
            Initializing PhilFIDA LCMS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
