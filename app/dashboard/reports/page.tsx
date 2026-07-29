'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Employee, LeaveBalance, LeaveTransaction } from '@/types';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  Search, 
  User, 
  RefreshCw,
  Building,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [leaveCardData, setLeaveCardData] = useState<any | null>(null);
  const [lowBalanceData, setLowBalanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaveCard' | 'lowBalance' | 'utilization'>('leaveCard');

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setEmployees(data.data);
        setSelectedEmployeeId(data.data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load employees list');
    }
  };

  const fetchLeaveCard = async (empId: string) => {
    if (!empId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?type=leaveCard&employeeId=${empId}`);
      const data = await res.json();
      if (data.success) {
        setLeaveCardData(data.data);
      }
    } catch (err) {
      toast.error('Failed to generate leave card');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowBalance = async () => {
    try {
      const res = await fetch('/api/reports?type=lowBalance&threshold=3.0');
      const data = await res.json();
      if (data.success) {
        setLowBalanceData(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load low balance report');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLowBalance();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchLeaveCard(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!leaveCardData) return;
    const { employee, transactions } = leaveCardData;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `PHILFIDA OFFICIAL LEAVE CARD - ${employee.firstName} ${employee.lastName} (${employee.employeeNumber})\n`;
    csvContent += `Position,${employee.position}\nOffice,${employee.office}\nDivision,${employee.division}\n\n`;
    csvContent += "Date,Source,Transaction Type,Leave Type,Amount,Balance Before,Balance After,Remarks\n";

    transactions.forEach((t: LeaveTransaction) => {
      csvContent += `${new Date(t.createdAt).toLocaleDateString()},"${t.source}",${t.transactionType},${t.leaveType?.code || ''},${t.amount},${t.balanceBefore},${t.balanceAfter},"${t.remarks.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PHILFIDA_LEAVE_CARD_${employee.employeeNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exported successfully!');
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Header (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Reports & CSC Printable Leave Cards
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Government CSC Form 6 compliant printable leave card, low leave balance alerts, and ledger export
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('leaveCard')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'leaveCard' ? 'bg-white dark:bg-slate-900 text-[#0F2C59] dark:text-amber-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Employee Leave Card
          </button>
          <button
            onClick={() => setActiveTab('lowBalance')}
            className={`px-3 py-1.5 rounded-md transition ${activeTab === 'lowBalance' ? 'bg-white dark:bg-slate-900 text-[#0F2C59] dark:text-amber-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
          >
            Low Balance Alerts
          </button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEE LEAVE CARD */}
      {activeTab === 'leaveCard' && (
        <div className="space-y-6">
          {/* Controls Bar (Hidden on print) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Employee:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeNumber}) - {e.division}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F2C59] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#1E407C] transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print CSC Form 6</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Printable CSC Form 6 Card Container */}
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0F2C59]" />
              <p className="text-xs font-semibold text-slate-500">Generating government leave card...</p>
            </div>
          ) : leaveCardData && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-300 dark:border-slate-800 shadow-md font-serif text-slate-900 dark:text-slate-100 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Header Stamp */}
              <div className="border-b-2 border-slate-900 dark:border-white pb-4 mb-6 text-center space-y-1">
                <p className="text-[10px] font-sans uppercase font-extrabold tracking-widest text-slate-500">
                  Republic of the Philippines • Department of Agriculture
                </p>
                <h2 className="text-base font-sans font-black uppercase text-[#0F2C59] dark:text-amber-400 tracking-tight">
                  PHILIPPINE FIBER INDUSTRY DEVELOPMENT AUTHORITY (PhilFIDA)
                </h2>
                <h3 className="text-sm font-sans font-bold uppercase underline tracking-wider pt-1">
                  EMPLOYEE LEAVE CREDIT RECORD CARD (CSC FORM 6 ALIGNED)
                </h3>
              </div>

              {/* Employee Info Header Block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-6 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Employee Name</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {leaveCardData.employee.firstName} {leaveCardData.employee.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Employee Number</span>
                  <span className="font-mono font-bold">{leaveCardData.employee.employeeNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Position</span>
                  <span className="font-medium">{leaveCardData.employee.position}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Office / Division</span>
                  <span className="font-medium">{leaveCardData.employee.office} - {leaveCardData.employee.division}</span>
                </div>
              </div>

              {/* Balances Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6 font-sans">
                {leaveCardData.balances.map((b: LeaveBalance) => (
                  <div key={b.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {b.leaveType?.leaveName} ({b.leaveType?.code})
                    </span>
                    <span className="text-xl font-black font-mono text-[#0F2C59] dark:text-amber-400">
                      {b.balance.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Days Available</span>
                  </div>
                ))}
              </div>

              {/* Detailed Transaction History Ledger */}
              <h4 className="font-sans font-bold text-xs uppercase text-slate-500 mb-2">
                Official Leave Credit Ledger History ({leaveCardData.transactions.length} Transactions)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse border border-slate-200 dark:border-slate-700">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-900 dark:text-slate-200">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700">Date</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700">Source</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700">Leave Type</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-right">Debit / Credit</th>
                      <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-right">Balance After</th>
                      <th className="p-2">Particulars / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {leaveCardData.transactions.map((tx: LeaveTransaction) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-medium">
                          {tx.source}
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold">
                          {tx.leaveType?.code || 'LEAVE'}
                        </td>
                        <td className={`p-2 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-bold ${
                          tx.transactionType === 'Credit' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.transactionType === 'Credit' ? '+' : '-'}{tx.amount.toFixed(3)}
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-right font-mono font-black text-slate-900 dark:text-white">
                          {tx.balanceAfter.toFixed(3)}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300 text-[11px]">
                          {tx.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Footer Block */}
              <div className="mt-12 pt-8 border-t border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div>
                  <div className="border-b border-slate-900 dark:border-white pb-1 font-bold">
                    {leaveCardData.employee.firstName} {leaveCardData.employee.lastName}
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-1 block">Employee Signature</span>
                </div>
                <div>
                  <div className="border-b border-slate-900 dark:border-white pb-1 font-bold">
                    HR & Administrative Officer
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-1 block">Certified Correct & Approved</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOW BALANCE ALERTS */}
      {activeTab === 'lowBalance' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Low Leave Balance Alerts (VL Balance &lt; 3.0 Days)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee Number</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4 text-right">Vacation Leave Balance</th>
                  <th className="py-3 px-4 text-center">Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowBalanceData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No employees with critical low leave balances
                    </td>
                  </tr>
                ) : (
                  lowBalanceData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-[11px]">{item.employee.employeeNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {item.employee.firstName} {item.employee.lastName}
                      </td>
                      <td className="py-3 px-4">{item.employee.division}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                        {item.balance.balance.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Critical Low
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
