import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          404 — Page Not Found
        </h1>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The requested page or resource does not exist in PhilFIDA Regional Office VII Leave Credit System.
        </p>

        <div className="pt-2 flex justify-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-md transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
