'use client';

import React from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Users, 
  FileText, 
  History, 
  Printer, 
  ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExportPage() {
  const handleDownload = (target: string, label: string) => {
    toast.info(`Generating ${label} CSV export file...`);
    window.open(`/api/export?target=${target}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Agency Consolidated Export Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download CSV data extracts for PhilFIDA Region VII daily HR operations and reporting
            </p>
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export 1: Employee Directory */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-[#0F2C59] transition">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Employee Roster Directory</h2>
              <p className="text-xs text-slate-500">Export active employee details, stations, units, and positions</p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('employees', 'Employee Roster')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#0F2C59] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#1E407C] transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Employees CSV</span>
          </button>
        </div>

        {/* Export 2: Complete Leave Ledger */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-[#0F2C59] transition">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Complete Leave Transaction Ledger</h2>
              <p className="text-xs text-slate-500">Export immutable credit, debit, and adjustment transaction history</p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('ledger', 'Leave Ledger')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Leave Ledger CSV</span>
          </button>
        </div>

        {/* Export 3: Submitted Applications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-[#0F2C59] transition">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Submitted Leave Applications</h2>
              <p className="text-xs text-slate-500">Export application records, inclusive dates, reasons, and approval statuses</p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('applications', 'Leave Applications')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-amber-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Applications CSV</span>
          </button>
        </div>

        {/* Export 4: Audit Logs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-[#0F2C59] transition">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Security Audit Trail Logs</h2>
              <p className="text-xs text-slate-500">Export full security audit history including logins, approvals, and changes</p>
            </div>
          </div>

          <button
            onClick={() => handleDownload('audit', 'Security Audit Logs')}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-purple-800 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Audit Logs CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
