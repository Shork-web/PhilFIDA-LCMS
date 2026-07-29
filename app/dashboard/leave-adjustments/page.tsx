'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Employee, LeaveType, LeaveAdjustment, LeaveBalance } from '@/types';
import { 
  SlidersHorizontal, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Paperclip, 
  Search,
  User,
  Calendar,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveAdjustmentsPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [adjustments, setAdjustments] = useState<LeaveAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    adjustmentType: 'Credit' as 'Credit' | 'Debit',
    amount: 1.0,
    reason: '',
    attachmentUrl: '',
  });

  // Current balance display helper
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [empRes, ltRes, adjRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/leave-types'),
        fetch('/api/leave-adjustments'),
      ]);

      const empData = await empRes.json();
      const ltData = await ltRes.json();
      const adjData = await adjRes.json();

      if (empData.success) setEmployees(empData.data || []);
      if (ltData.success) setLeaveTypes(ltData.data || []);
      if (adjData.success) setAdjustments(adjData.data || []);
    } catch (error) {
      toast.error('Failed to load manual adjustments data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch current balance whenever employee & leave type selection changes
  useEffect(() => {
    if (formData.employeeId && formData.leaveTypeId) {
      fetch(`/api/leave-balances?employeeId=${formData.employeeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const list: LeaveBalance[] = data.data || [];
            const record = list.find(b => b.leaveTypeId === formData.leaveTypeId);
            setCurrentBalance(record ? record.balance : 0);
          }
        })
        .catch(() => setCurrentBalance(null));
    } else {
      setCurrentBalance(null);
    }
  }, [formData.employeeId, formData.leaveTypeId]);

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'adjustment_memos');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, attachmentUrl: data.url }));
        toast.success('Adjustment memo attached!');
      } else {
        toast.error(data.message || 'File upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  // Submit Manual Adjustment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.leaveTypeId || !formData.reason || formData.amount <= 0) {
      toast.error('Please complete all required fields with valid positive amount');
      return;
    }

    if (formData.adjustmentType === 'Debit' && currentBalance !== null && currentBalance < formData.amount) {
      toast.error(`Cannot debit ${formData.amount} days! Employee current balance is only ${currentBalance.toFixed(3)} days.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/leave-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.email || 'admin@philfida.da.gov.ph',
          userId: user?.id || 'user_admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Manual leave adjustment executed successfully!');
        setFormData({
          employeeId: '',
          leaveTypeId: '',
          adjustmentType: 'Credit',
          amount: 1.0,
          reason: '',
          attachmentUrl: '',
        });
        fetchInitialData();
      } else {
        toast.error(data.message || data.error || 'Failed to execute adjustment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error processing adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Manual Leave Credit Adjustments
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Admin facility for correcting leave balances, granting special credits, or deducting disputed days with automatic ledger logging
            </p>
          </div>
        </div>

        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldAlert className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">New Adjustment Entry</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Employee Selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Type Selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Leave Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.leaveTypeId}
                onChange={(e) => setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">-- Choose Leave Type --</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.code} - {lt.leaveName}
                  </option>
                ))}
              </select>

              {currentBalance !== null && (
                <div className="mt-1.5 p-2 rounded bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Current Balance:</span>
                  <span className="font-bold text-[#0F2C59] dark:text-amber-400 font-mono text-sm">
                    {currentBalance.toFixed(3)} days
                  </span>
                </div>
              )}
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Adjustment Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, adjustmentType: 'Credit' }))}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    formData.adjustmentType === 'Credit'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Credit (+ Add)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, adjustmentType: 'Debit' }))}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    formData.adjustmentType === 'Debit'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Debit (- Deduct)</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Amount (Number of Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.125"
                min="0.125"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono font-bold"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Official Reason / Memo Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State official basis or memorandum reference for balance adjustment..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Attachment File */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Attachment / Approved Office Memo (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59]/10 file:text-[#0F2C59]"
              />
              {formData.attachmentUrl && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">✓ Memo file attached</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-2.5 rounded-lg font-bold text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Execute Adjustment & Update Ledger</span>
            </button>
          </form>
        </div>

        {/* History Table Container */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Manual Adjustments History ({adjustments.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No manual adjustments recorded yet
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(adj.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {adj.employee ? `${adj.employee.firstName} ${adj.employee.lastName}` : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {adj.leaveType?.code || 'LEAVE'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adj.adjustmentType === 'Credit'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          <span>{adj.adjustmentType}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {adj.adjustmentType === 'Credit' ? `+${adj.amount.toFixed(3)}` : `-${adj.amount.toFixed(3)}`}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={adj.reason}>
                        {adj.reason}
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                        {adj.createdBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
