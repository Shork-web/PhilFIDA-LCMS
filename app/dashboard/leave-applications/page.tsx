'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { LeaveApplication, LeaveType, LeaveBalance } from '@/types';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Paperclip, 
  Upload, 
  X, 
  RefreshCw,
  Info,
  CalendarCheck,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveApplicationsPage() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal Dialog
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    numberOfDays: 1,
    reason: '',
    attachmentUrl: '',
  });

  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'>('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const empId = user?.employeeId;
      const url = empId ? `/api/leave-applications?employeeId=${empId}` : '/api/leave-applications';

      const [appRes, ltRes, balRes] = await Promise.all([
        fetch(url),
        fetch('/api/leave-types'),
        empId ? fetch(`/api/leave-balances?employeeId=${empId}`) : Promise.resolve(null),
      ]);

      const appData = await appRes.json();
      const ltData = await ltRes.json();

      if (appData.success) setApplications(appData.data || []);
      if (ltData.success) setLeaveTypes(ltData.data || []);

      if (balRes) {
        const balData = await balRes.json();
        if (balData.success) setBalances(balData.data || []);
      }
    } catch (error) {
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Compute number of days automatically when start date or end date changes
  const handleDateChange = (start: string, end: string) => {
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      if (d2 >= d1) {
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, startDate: start, endDate: end, numberOfDays: diffDays }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  // Selected leave type balance
  const selectedBalanceRecord = balances.find(b => b.leaveTypeId === formData.leaveTypeId);
  const selectedBalance = selectedBalanceRecord ? selectedBalanceRecord.balance : 0;

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'leave_attachments');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, attachmentUrl: data.url }));
        toast.success('Attachment uploaded successfully!');
      } else {
        toast.error(data.message || 'File upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Submit Leave Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.employeeId) {
      toast.error('No employee profile associated with your user account');
      return;
    }

    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please complete all required fields');
      return;
    }

    if (formData.numberOfDays <= 0) {
      toast.error('Number of days must be at least 1 day');
      return;
    }

    if (formData.numberOfDays > selectedBalance) {
      toast.error(`Insufficient leave balance! Available: ${selectedBalance.toFixed(3)} days, Requested: ${formData.numberOfDays} days`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/leave-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.employeeId,
          leaveTypeId: formData.leaveTypeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          numberOfDays: formData.numberOfDays,
          reason: formData.reason,
          attachmentUrl: formData.attachmentUrl || undefined,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Leave application submitted successfully!');
        setIsModalOpen(false);
        setFormData({
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          numberOfDays: 1,
          reason: '',
          attachmentUrl: '',
        });
        fetchData();
      } else {
        toast.error(data.message || data.error || 'Failed to submit leave application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Server error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Application
  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending leave application?')) return;

    try {
      const res = await fetch(`/api/leave-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Leave application cancelled');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to cancel application');
      }
    } catch (error) {
      toast.error('Error cancelling application');
    }
  };

  // Filtered applications by tab
  const filteredApps = applications.filter((app) => {
    if (activeTab === 'All') return true;
    return app.status === activeTab;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Leave Applications & Requests
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit official PhilFIDA leave applications, upload medical/supporting documents, and track approval status
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#1E407C] rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {(['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'] as const).map((tab) => {
          const count = tab === 'All' ? applications.length : applications.filter(a => a.status === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? 'bg-[#0F2C59] text-white shadow-xs dark:bg-slate-800 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2C59]" />
            <p className="text-xs text-slate-500">Loading applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No leave applications found</p>
            <p className="text-xs text-slate-500 mt-1">There are no leave applications under the '{activeTab}' filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {app.leaveType?.code || 'LEAVE'}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {app.leaveType?.leaveName}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : app.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : app.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {app.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
                    {app.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                    {app.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                    <span>{app.status}</span>
                  </span>
                </div>

                {/* Employee info if HR view */}
                {app.employee && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">Applicant:</span> {app.employee.firstName} {app.employee.lastName} ({app.employee.employeeNumber})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Inclusive Dates</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {app.startDate} to {app.endDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Duration</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      <strong>{app.numberOfDays}</strong> {app.numberOfDays === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Reason: </span>
                  {app.reason}
                </div>

                {/* Attachment Link */}
                {app.attachmentUrl && (
                  <div className="flex items-center space-x-1.5 text-xs text-[#0F2C59] dark:text-amber-400">
                    <Paperclip className="w-3.5 h-3.5" />
                    <a
                      href={app.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline font-medium"
                    >
                      View Supporting Attachment Document
                    </a>
                  </div>
                )}

                {/* Approval Remarks if available */}
                {app.approvalRemarks && (
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-l-2 border-[#0F2C59] dark:border-amber-400 text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">HR Remarks:</span> {app.approvalRemarks}
                  </div>
                )}

                {/* Footer timestamp & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Submitted on {new Date(app.createdAt).toLocaleDateString()}</span>

                  {app.status === 'Pending' && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                    >
                      Cancel Application
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE LEAVE APPLICATION MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-[#0F2C59] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Submit New Leave Application</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Leave Type */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.filter(lt => lt.isActive).map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.code} - {lt.leaveName}
                    </option>
                  ))}
                </select>

                {/* Available balance indicator */}
                {formData.leaveTypeId && (
                  <div className="mt-1.5 p-2 rounded bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Available Balance:</span>
                    <span className="font-bold text-[#0F2C59] dark:text-amber-400 font-mono text-sm">
                      {selectedBalance.toFixed(3)} days
                    </span>
                  </div>
                )}
              </div>

              {/* Inclusive Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => handleDateChange(e.target.value, formData.endDate)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => handleDateChange(formData.startDate, e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                  />
                </div>
              </div>

              {/* Number of days */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Number of Days <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfDays: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] focus:outline-none font-mono"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Reason for Leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify clear details or justification for leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] focus:outline-none"
                />
              </div>

              {/* Attachment File Upload */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Supporting Attachment (Optional / Required for Sick Leave {'>'} 2 days)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59]/10 file:text-[#0F2C59] hover:file:bg-[#0F2C59]/20 dark:file:bg-slate-800 dark:file:text-amber-400"
                  />
                  {uploading && <RefreshCw className="w-4 h-4 animate-spin text-[#0F2C59]" />}
                </div>
                {formData.attachmentUrl && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Attachment linked successfully
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-xs transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Leave Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
