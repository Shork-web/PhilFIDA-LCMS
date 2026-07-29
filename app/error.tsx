'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('System Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          Unexpected System Error
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          An error occurred while processing your request in the PhilFIDA Leave Credit Management System.
        </p>

        {error.message && (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-rose-600 dark:text-rose-400 text-left overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center space-x-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white bg-[#0F2C59] hover:bg-[#1E407C] transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
