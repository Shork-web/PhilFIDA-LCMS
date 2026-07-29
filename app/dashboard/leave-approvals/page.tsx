'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { LeaveApplication, LeaveBalance } from '@/types';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  Paperclip, 
  AlertTriangle, 
  RefreshCw, 
  X,
  ExternalLink,
  ShieldAlert,
  GitMerge
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveApprovalsPage() {
  const { user } = useAuthStore();
  const [pendingApps, setPendingApps] = useState<LeaveApplication[]>([]);
  const [processedApps, setProcessedApps] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [viewTab, setViewTab] = useState<'Pending' | 'SupervisorApproved' | 'Processed'>('Pending');

  // Approval Modal State
  const [selectedApp, setSelectedApp] = useState<LeaveApplication | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected' | null>(null);
  const [applicantBalance, setApplicantBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const isSupervisor = user?.roleName === 'Supervisor';

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leave-applications');
      const data = await res.json();
      if (data.success) {
        const all: LeaveApplication[] = data.data || [];
        setPendingApps(all.filter(a => a.status === 'Pending' || a.status === 'Supervisor Approved'));
        setProcessedApps(all.filter(a => a.status === 'Approved' || a.status === 'Rejected'));
      }
    } catch (error) {
      toast.error('Failed to load leave approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Open Approval/Rejection Dialog & fetch current applicant balance
  const openActionDialog = async (app: LeaveApplication, action: 'Approved' | 'Rejected') => {
    setSelectedApp(app);
    setActionType(action);
    setApprovalRemarks('');
    setApplicantBalance(null);

    if (action === 'Approved') {
      try {
        setCheckingBalance(true);
        const res = await fetch(`/api/leave-balances?employeeId=${app.employeeId}`);
        const data = await res.json();
        if (data.success) {
          const list: LeaveBalance[] = data.data || [];
          const record = list.find(b => b.leaveTypeId === app.leaveTypeId);
          setApplicantBalance(record ? record.balance : 0);
        }
      } catch (error) {
        toast.error('Failed to check applicant current balance');
      } finally {
        setCheckingBalance(false);
      }
    }
  };

  // Submit Approval or Rejection Decision
  const handleConfirmAction = async () => {
    if (!selectedApp || !actionType) return;

    // Check balance sufficiency before approving
    if (actionType === 'Approved' && applicantBalance !== null && applicantBalance < selectedApp.numberOfDays) {
      toast.error(`Cannot approve: Applicant available balance (${applicantBalance.toFixed(3)}) is less than requested leave days (${selectedApp.numberOfDays}).`);
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/leave-applications/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType,
          approvalRemarks,
          approverId: user?.id || 'user_hr',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Leave application successfully ${actionType.toLowerCase()}!`);
        setSelectedApp(null);
        setActionType(null);
        fetchApplications();
      } else {
        toast.error(data.message || data.error || 'Failed to process approval');
      }
    } catch (error: any) {
      toast.error('Error submitting approval decision');
    } finally {
      setProcessing(false);
    }
  };

  const isInsufficientBalance = selectedApp && actionType === 'Approved' && applicantBalance !== null && applicantBalance < selectedApp.numberOfDays;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Leave Applications Approvals Queue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PhilFIDA Region VII Multi-Level Approval Hub (Stage 1: Unit Supervisor Endorsement → Stage 2: HR Administrator Final Approval & Ledger Deduction)
            </p>
          </div>
        </div>

        <button
          onClick={fetchApplications}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewTab('Pending')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-2 ${
            viewTab === 'Pending'
              ? 'bg-[#0F2C59] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Approvals ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setViewTab('Processed')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center space-x-2 ${
            viewTab === 'Processed'
              ? 'bg-[#0F2C59] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Processed History ({processedApps.length})</span>
        </button>
      </div>

      {/* Applications Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2C59]" />
            <p className="text-xs text-slate-500 font-semibold">Loading approval queue...</p>
          </div>
        ) : (viewTab === 'Pending' ? pendingApps : processedApps).length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No applications in queue</h3>
            <p className="text-xs text-slate-400 mt-1">There are no leave applications requiring review in this tab.</p>
          </div>
        ) : (
          (viewTab === 'Pending' ? pendingApps : processedApps).map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition hover:border-[#0F2C59]"
            >
              {/* Applicant Info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F2C59] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {app.employee ? `${app.employee.firstName[0]}${app.employee.lastName[0]}` : 'PF'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {app.employee ? `${app.employee.firstName} ${app.employee.lastName}` : 'Employee'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {app.employee?.employeeNumber} • {app.employee?.division}
                    </p>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Leave Category</span>
                    <span className="font-bold text-[#0F2C59] dark:text-amber-400">
                      {app.leaveType?.leaveName} ({app.leaveType?.code})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Inclusive Dates</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {app.startDate} to {app.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {app.numberOfDays} Day(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Stage</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      app.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'Supervisor Approved'
                        ? 'bg-blue-100 text-blue-800'
                        : app.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">Reason:</span> {app.reason}
                </p>

                {app.attachmentUrl && (
                  <div className="flex items-center space-x-2 text-xs">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <a
                      href={app.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      View Medical / Supporting Document <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {viewTab === 'Pending' && (
                <div className="flex items-center space-x-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                  <button
                    onClick={() => openActionDialog(app, 'Approved')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Request</span>
                  </button>

                  <button
                    onClick={() => openActionDialog(app, 'Rejected')}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white bg-rose-700 hover:bg-rose-800 shadow-xs transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* APPROVAL / REJECTION DECISION MODAL */}
      {selectedApp && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full overflow-hidden">
            <div className={`p-4 text-white flex items-center justify-between ${
              actionType === 'Approved' ? 'bg-emerald-800' : 'bg-rose-800'
            }`}>
              <h3 className="font-bold text-sm flex items-center space-x-2">
                {actionType === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span>Confirm Leave {actionType} — {selectedApp.employee?.firstName} {selectedApp.employee?.lastName}</span>
              </h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Applicant Current Balance Indicator */}
              {actionType === 'Approved' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Applicant Current Available {selectedApp.leaveType?.code} Balance:
                    </span>
                    {checkingBalance ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <span className="font-mono font-black text-base text-[#0F2C59] dark:text-amber-400">
                        {applicantBalance !== null ? applicantBalance.toFixed(3) : '0.000'} Days
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-mono">
                    <span className="text-slate-500">Days Requested:</span>
                    <span className="font-bold text-rose-600">-{selectedApp.numberOfDays.toFixed(3)} Days</span>
                  </div>

                  {applicantBalance !== null && (
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-mono font-bold">
                      <span className="text-slate-700 dark:text-slate-200">Balance After Approval:</span>
                      <span className={applicantBalance - selectedApp.numberOfDays < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {(applicantBalance - selectedApp.numberOfDays).toFixed(3)} Days
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Insufficient Balance Alert */}
              {isInsufficientBalance && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start space-x-3 text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">INSUFFICIENT LEAVE BALANCE PREVENTING APPROVAL</p>
                    <p className="text-[11px] mt-0.5">
                      The applicant has <strong>{applicantBalance?.toFixed(3)}</strong> days available, which is less than the <strong>{selectedApp.numberOfDays}</strong> days requested. Approval cannot proceed.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Approval / Rejection Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks for the applicant..."
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processing || Boolean(isInsufficientBalance)}
                  onClick={handleConfirmAction}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-white shadow-xs transition disabled:opacity-50 ${
                    actionType === 'Approved' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {processing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm {actionType}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
