'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { MonthlyAccrualLog } from '@/types';
import { 
  RotateCw, 
  Play, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Calendar, 
  Users, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyAccrualPage() {
  const { user } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [logs, setLogs] = useState<MonthlyAccrualLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  const fetchPreviewAndLogs = async () => {
    try {
      setLoading(true);
      const [prevRes, logsRes] = await Promise.all([
        fetch(`/api/monthly-accrual?month=${selectedMonth}&year=${selectedYear}`),
        fetch(`/api/monthly-accrual?mode=logs`),
      ]);

      const prevJson = await prevRes.json();
      const logsJson = await logsRes.json();

      if (prevJson.success) setPreviewData(prevJson.data);
      if (logsJson.success) setLogs(logsJson.data || []);
    } catch (error) {
      toast.error('Failed to load monthly accrual preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewAndLogs();
  }, [selectedMonth, selectedYear]);

  // Execute Monthly Accrual Process
  const handleExecuteAccrual = async () => {
    if (previewData?.isMonthFullyProcessed) {
      if (!confirm(`WARNING: Monthly accrual for ${selectedMonth}/${selectedYear} has ALREADY been fully processed for active employees! Do you still want to re-run for any new active employees?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to execute Monthly Leave Credit Accrual for ${selectedMonth}/${selectedYear}? This will credit +${previewData?.settings?.monthlyVacationLeave} VL and +${previewData?.settings?.monthlySickLeave} SL to all active agency staff.`)) {
        return;
      }
    }

    try {
      setExecuting(true);
      const res = await fetch('/api/monthly-accrual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          processedBy: user?.email || 'admin@philfida.da.gov.ph',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Accrual process completed! ${data.data.successCount} employees credited.`);
        fetchPreviewAndLogs();
      } else {
        toast.error(data.message || data.error || 'Accrual execution failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error executing accrual');
    } finally {
      setExecuting(false);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Automatic Monthly Leave Credit Accrual Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Batch credit process for monthly Vacation Leave (+1.25) and Sick Leave (+1.25) earned credits per CSC policies
            </p>
          </div>
        </div>

        <button
          onClick={fetchPreviewAndLogs}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Accrual</span>
        </button>
      </div>

      {/* Control Bar & Duplicate Warning */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExecuteAccrual}
            disabled={executing || loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-white bg-[#1B4D3E] hover:bg-[#153e32] shadow-md transition disabled:opacity-50"
          >
            {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span>Execute Accrual for {monthNames[selectedMonth - 1]} {selectedYear}</span>
          </button>
        </div>

        {/* Warning Banner if already processed */}
        {previewData?.isMonthFullyProcessed && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center space-x-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">DUPLICATE ACCRUAL WARNING</p>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                Monthly leave credit accrual for <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong> has already been fully processed for active employees ({previewData?.alreadyProcessedCount} employees). Re-running will only credit newly added employees who have not received their credits yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Eye className="w-4 h-4 text-[#0F2C59] dark:text-amber-400" />
            <span>Accrual Execution Preview ({previewData?.totalActiveEmployees || 0} Active Employees)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Rate: +{previewData?.settings?.monthlyVacationLeave} VL / +{previewData?.settings?.monthlySickLeave} SL per month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee Number</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Office & Division</th>
                <th className="py-3 px-4 text-right text-emerald-600">Proposed VL Credit</th>
                <th className="py-3 px-4 text-right text-emerald-600">Proposed SL Credit</th>
                <th className="py-3 px-4 text-center">Accrual Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading preview...</td>
                </tr>
              ) : previewData?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No active employees found</td>
                </tr>
              ) : (
                previewData?.items?.map((item: any) => (
                  <tr key={item.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono text-[11px] font-semibold">{item.employee.employeeNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.employee.firstName} {item.employee.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {item.employee.division}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{item.vacationCredited.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{item.sickCredited.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Already Processed'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {item.status === 'Already Processed' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Accrual Runs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">Historical Accrual Run Logs ({logs.length})</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 text-right">VL Credited</th>
                <th className="py-3 px-4 text-right">SL Credited</th>
                <th className="py-3 px-4">Processed Date</th>
                <th className="py-3 px-4">Processed By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No monthly accrual logs recorded yet</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold font-mono">
                      {monthNames[log.month - 1]} {log.year}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{log.vacationCredited.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{log.sickCredited.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      {new Date(log.processedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {log.processedBy}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {log.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
