'use client';

import React from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';

export function GovHeader() {
  return (
    <div className="w-full bg-[#0A1F3F] text-slate-200 text-xs px-4 py-1.5 border-b border-blue-900/60 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center gap-1 font-bold text-amber-400">
          <Landmark className="w-3.5 h-3.5" />
          GOVPH
        </span>
        <span className="hidden sm:inline text-slate-400">|</span>
        <span className="hidden sm:inline font-medium text-slate-300">
          Republic of the Philippines &bull; Department of Agriculture
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" />
          PhilFIDA Official Portal
        </span>
      </div>
    </div>
  );
}
