'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Employee, 
  LeaveBalance, 
  LeaveTransaction, 
  LeaveApplication, 
  LeaveAdjustment, 
  CTORequest,
  DocumentRecord,
  AuditLog
} from '@/types';
import { 
  UserCircle, 
  Calendar, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  SlidersHorizontal, 
  Clock, 
  ArrowLeft,
  RefreshCw,
  Paperclip,
  CheckCircle2,
  XCircle,
  History,
  Download,
  UserCheck,
  Mail,
  Phone,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EmployeeProfileDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id: employeeId } = use(props.params);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [adjustments, setAdjustments] = useState<LeaveAdjustment[]>([]);
  const [ctoRequests, setCtoRequests] = useState<CTORequest[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'Personal' | 'Balances' | 'Ledger' | 'Applications' | 'CTO' | 'Adjustments' | 'Documents' | 'Audit'>('Personal');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [empRes, balRes, txRes, appRes, adjRes, ctoRes, docRes, auditRes] = await Promise.all([
        fetch(`/api/employees`),
        fetch(`/api/leave-balances?employeeId=${employeeId}`),
        fetch(`/api/leave-transactions?employeeId=${employeeId}`),
        fetch(`/api/leave-applications?employeeId=${employeeId}`),
        fetch(`/api/leave-adjustments?employeeId=${employeeId}`),
        fetch(`/api/cto?employeeId=${employeeId}`),
        fetch(`/api/documents?employeeId=${employeeId}`),
        fetch(`/api/audit`),
      ]);

      const empData = await empRes.json();
      const balData = await balRes.json();
      const txData = await txRes.json();
      const appData = await appRes.json();
      const adjData = await adjRes.json();
      const ctoData = await ctoRes.json();
      const docData = await docRes.json();
      const auditData = await auditRes.json();

      if (empData.success) {
        const found = (empData.data as Employee[]).find(e => e.id === employeeId);
        setEmployee(found || null);
      }
      if (balData.success) setBalances(balData.data || []);
      if (txData.success) setTransactions(txData.data || []);
      if (appData.success) setApplications(appData.data || []);
      if (adjData.success) setAdjustments(adjData.data || []);
      if (ctoData.success) setCtoRequests(ctoData.data || []);
      if (docData.success) setDocuments(docData.data || []);
      if (auditData.success) {
        setAuditLogs((auditData.data || []).filter((l: AuditLog) => l.recordId === employeeId || l.userId === employeeId));
      }
    } catch (error) {
      toast.error('Failed to load employee profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0F2C59]" />
        <p className="text-sm font-semibold text-slate-600">Loading employee 8-tab profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <UserCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Employee Profile Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No employee record matches ID: {employeeId}</p>
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2C59] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employee Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link & Header Card */}
      <div className="space-y-4">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>

        {/* Profile Banner Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-4 rounded-2xl bg-[#0F2C59] text-amber-400 font-bold text-xl uppercase tracking-wider flex items-center justify-center shrink-0">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}{employee.lastName} {employee.suffix || ''}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {employee.employmentStatus}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400">
                {employee.position} • {employee.appointmentType}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{employee.division}</span>
                </span>
                <span>•</span>
                <span>{employee.office}</span>
                <span>•</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">{employee.employeeNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
            <Link href="/dashboard/reports">
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F2C59] text-white font-bold rounded-lg text-xs shadow-xs hover:bg-[#1E407C]">
                <FileText className="w-3.5 h-3.5" />
                <span>Print Leave Card</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced 8-Tab Profile Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-1 text-xs font-bold">
        {[
          { id: 'Personal', label: 'Personal & Appointment', icon: UserCircle },
          { id: 'Balances', label: `Leave Balances (${balances.length})`, icon: Briefcase },
          { id: 'Ledger', label: `Ledger (${transactions.length})`, icon: FileSpreadsheet },
          { id: 'Applications', label: `Applications (${applications.length})`, icon: FileText },
          { id: 'CTO', label: `CTO Claims (${ctoRequests.length})`, icon: Clock },
          { id: 'Adjustments', label: `Adjustments (${adjustments.length})`, icon: SlidersHorizontal },
          { id: 'Documents', label: `Documents (${documents.length})`, icon: Paperclip },
          { id: 'Audit', label: `Audit History (${auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-[#0F2C59] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'Personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] border-b border-slate-200 dark:border-slate-700 pb-2">
                Personal Identification Details
              </h3>
              <p><strong>Full Name:</strong> {employee.firstName} {employee.middleName} {employee.lastName} {employee.suffix}</p>
              <p><strong>Employee Number:</strong> <span className="font-mono font-bold">{employee.employeeNumber}</span></p>
              <p className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span><strong>Email:</strong> {employee.email}</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span><strong>Contact Number:</strong> {employee.contactNumber}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] border-b border-slate-200 dark:border-slate-700 pb-2">
                Official Agency Appointment Info
              </h3>
              <p><strong>Station Office:</strong> {employee.office}</p>
              <p><strong>Unit / Division:</strong> {employee.division}</p>
              <p><strong>Designated Position:</strong> {employee.position}</p>
              <p><strong>Appointment Type:</strong> {employee.appointmentType}</p>
              <p><strong>Date of Original Appointment:</strong> {employee.appointmentDate}</p>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVE BALANCES */}
        {activeTab === 'Balances' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F2C59] text-white">
                  {b.leaveType?.code}
                </span>
                <div className="text-2xl font-black font-mono text-[#0F2C59] dark:text-amber-400">
                  {b.balance.toFixed(3)}
                </div>
                <p className="text-[10px] text-slate-400">Days Available</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: LEDGER */}
        {activeTab === 'Ledger' && (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-right">Balance After</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2.5 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5 font-medium">{tx.source}</td>
                    <td className="p-2.5 font-bold">{tx.transactionType}</td>
                    <td className="p-2.5 font-bold">{tx.leaveType?.code}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{tx.amount.toFixed(3)}</td>
                    <td className="p-2.5 text-right font-mono font-black">{tx.balanceAfter.toFixed(3)}</td>
                    <td className="p-2.5 text-slate-500">{tx.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: APPLICATIONS */}
        {activeTab === 'Applications' && (
          <div className="space-y-2 text-xs">
            {applications.map((app) => (
              <div key={app.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                <div>
                  <p className="font-bold">{app.leaveType?.leaveName} ({app.numberOfDays} days)</p>
                  <p className="text-slate-500">{app.startDate} to {app.endDate} — Reason: {app.reason}</p>
                </div>
                <span className="font-bold text-emerald-600">{app.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: CTO */}
        {activeTab === 'CTO' && (
          <div className="space-y-2 text-xs">
            {ctoRequests.map((cto) => (
              <div key={cto.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                <div>
                  <p className="font-bold">Overtime Date: {cto.dateWorked} ({cto.hoursWorked} hrs)</p>
                  <p className="text-slate-500">{cto.reason}</p>
                </div>
                <span className="font-mono font-bold text-[#0F2C59] dark:text-amber-400">+{cto.equivalentLeave.toFixed(3)} days</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: ADJUSTMENTS */}
        {activeTab === 'Adjustments' && (
          <div className="space-y-2 text-xs">
            {adjustments.map((adj) => (
              <div key={adj.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between">
                <div>
                  <p className="font-bold">{adj.leaveType?.code} ({adj.adjustmentType})</p>
                  <p className="text-slate-500">Reason: {adj.reason}</p>
                </div>
                <span className="font-mono font-bold text-emerald-600">{adj.amount.toFixed(3)} days</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="space-y-2 text-xs">
            {documents.length === 0 ? (
              <p className="p-6 text-center text-slate-400">No attached files for this employee</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{doc.title}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{doc.fileName} — {doc.category}</p>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 8: AUDIT HISTORY */}
        {activeTab === 'Audit' && (
          <div className="space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <p className="p-6 text-center text-slate-400">No individual audit logs recorded</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{log.action} ({log.module})</p>
                    <p className="text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
