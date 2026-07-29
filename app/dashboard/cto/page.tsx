'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { CTORequest } from '@/types';
import { CTO_CONVERSION_SETTINGS } from '@/lib/constants';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Paperclip, 
  Info, 
  User,
  Calendar,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function CTOPage() {
  const { user, hasPermission } = useAuthStore();
  const [ctoRequests, setCtoRequests] = useState<CTORequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    dateWorked: '',
    hoursWorked: 8,
    reason: '',
    attachmentUrl: '',
  });

  const canApprove = user?.roleName === 'Super Admin' || hasPermission('cto.approve');

  const fetchCTOData = async () => {
    try {
      setLoading(true);
      const url = canApprove ? '/api/cto' : `/api/cto?employeeId=${user?.employeeId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCtoRequests(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load CTO requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCTOData();
  }, [user]);

  // Dynamic conversion display
  const calculatedCredits = (formData.hoursWorked * CTO_CONVERSION_SETTINGS.CREDITS_PER_HOUR).toFixed(3);

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'cto_documents');

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, attachmentUrl: data.url }));
        toast.success('Overtime proof document uploaded!');
      } else {
        toast.error(data.message || 'File upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Submit CTO Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.employeeId) {
      toast.error('User is not associated with an employee profile');
      return;
    }

    if (!formData.dateWorked || formData.hoursWorked <= 0 || !formData.reason) {
      toast.error('Please complete all required fields with valid hours');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/cto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.employeeId,
          dateWorked: formData.dateWorked,
          hoursWorked: formData.hoursWorked,
          reason: formData.reason,
          attachmentUrl: formData.attachmentUrl || undefined,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('CTO request submitted for HR approval!');
        setFormData({
          dateWorked: '',
          hoursWorked: 8,
          reason: '',
          attachmentUrl: '',
        });
        fetchCTOData();
      } else {
        toast.error(data.message || 'Failed to submit CTO request');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error submitting CTO request');
    } finally {
      setSubmitting(false);
    }
  };

  // Process Approval / Rejection
  const handleProcessCTO = async (id: string, status: 'Approved' | 'Rejected') => {
    const remarks = prompt(`Enter ${status} remarks:`, status === 'Approved' ? 'Approved per overtime log sheet' : 'Insufficient justification');
    if (remarks === null) return;

    try {
      const res = await fetch(`/api/cto/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvalRemarks: remarks,
          approverId: user?.employeeId || 'emp_102',
          userId: user?.id || 'user_hr',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`CTO Request ${status}! Leave balance credited.`);
        fetchCTOData();
      } else {
        toast.error(data.message || 'Failed to process CTO request');
      }
    } catch (error) {
      toast.error('Error processing CTO request');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Compensatory Time Off (CTO) Credits
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit earned weekend/holiday overtime hours and convert them into official CSC leave credits
            </p>
          </div>
        </div>

        <button
          onClick={fetchCTOData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Configurable Conversion Setting Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-[#0F2C59] dark:text-amber-400 shrink-0" />
          <div className="text-xs text-slate-800 dark:text-slate-200">
            <span className="font-bold">Official PhilFIDA / CSC Conversion Rule:</span>{' '}
            8 hours worked = <strong>1.0 day credit</strong> (Rate: {CTO_CONVERSION_SETTINGS.CREDITS_PER_HOUR} days credit per hour worked).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CTO Request Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileCheck className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">File CTO Earned Hours</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Date Worked <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateWorked}
                onChange={(e) => setFormData(prev => ({ ...prev, dateWorked: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hours Worked <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="24"
                required
                value={formData.hoursWorked}
                onChange={(e) => setFormData(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono font-bold"
              />

              {/* Conversion Calculator Preview */}
              <div className="mt-2 p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
                <span>Converted Credit Yield:</span>
                <span className="font-bold font-mono text-sm">{calculatedCredits} days</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Work / Overtime Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe task or project worked during overtime..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Supporting Overtime DTR / Accomplishment Proof
              </label>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59]/10 file:text-[#0F2C59]"
              />
              {formData.attachmentUrl && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">✓ Proof document linked</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-2.5 rounded-lg font-bold text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Submit CTO Claim</span>
            </button>
          </form>
        </div>

        {/* CTO Requests Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              CTO Claims Queue ({ctoRequests.length})
            </h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0F2C59]" />
                <span>Loading CTO requests...</span>
              </div>
            ) : ctoRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No CTO requests found
              </div>
            ) : (
              ctoRequests.map((cto) => (
                <div
                  key={cto.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {cto.employee ? `${cto.employee.firstName} ${cto.employee.lastName}` : 'N/A'}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Date Worked: <strong>{cto.dateWorked}</strong> ({cto.hoursWorked} hrs = <span className="text-[#0F2C59] dark:text-amber-400 font-bold font-mono">{cto.equivalentLeave.toFixed(3)} days credit</span>)
                      </p>
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cto.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : cto.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {cto.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {cto.reason}
                  </p>

                  {cto.attachmentUrl && (
                    <div className="flex items-center space-x-1.5 text-xs text-[#0F2C59] dark:text-amber-400">
                      <Paperclip className="w-3.5 h-3.5" />
                      <a href={cto.attachmentUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold">
                        View Overtime Proof Document
                      </a>
                    </div>
                  )}

                  {canApprove && cto.status === 'Pending' && (
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleProcessCTO(cto.id, 'Rejected')}
                        className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleProcessCTO(cto.id, 'Approved')}
                        className="px-4 py-1 text-xs font-bold text-white bg-[#1B4D3E] hover:bg-[#153e32] rounded-lg transition"
                      >
                        Approve & Credit Balance
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
