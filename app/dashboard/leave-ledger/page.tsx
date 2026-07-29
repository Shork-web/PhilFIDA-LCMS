'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LeaveTransaction, LeaveType, Employee } from '@/types';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveLedgerPage() {
  const [transactions, setTransactions] = useState<LeaveTransaction[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('all');
  const [selectedTxType, setSelectedTxType] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const [txRes, ltRes, empRes] = await Promise.all([
        fetch('/api/leave-transactions'),
        fetch('/api/leave-types'),
        fetch('/api/employees'),
      ]);

      const txData = await txRes.json();
      const ltData = await ltRes.json();
      const empData = await empRes.json();

      if (txData.success) setTransactions(txData.data || []);
      if (ltData.success) setLeaveTypes(ltData.data || []);
      if (empData.success) setEmployees(empData.data || []);
    } catch (error) {
      toast.error('Failed to load leave ledger history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const empName = tx.employee 
        ? `${tx.employee.firstName} ${tx.employee.lastName} ${tx.employee.employeeNumber}`.toLowerCase()
        : '';
      const matchesSearch = 
        empName.includes(searchQuery.toLowerCase()) ||
        tx.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLt = selectedLeaveType === 'all' || tx.leaveTypeId === selectedLeaveType;
      const matchesTxType = selectedTxType === 'all' || tx.transactionType === selectedTxType;
      const matchesSource = selectedSource === 'all' || tx.source === selectedSource;

      return matchesSearch && matchesLt && matchesTxType && matchesSource;
    });
  }, [transactions, searchQuery, selectedLeaveType, selectedTxType, selectedSource]);

  // Paginated View
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.warning('No transaction data to export');
      return;
    }

    const headers = [
      'Transaction ID',
      'Date & Time',
      'Employee Number',
      'Employee Name',
      'Office',
      'Leave Type',
      'Transaction Type',
      'Source',
      'Credit Days',
      'Debit Days',
      'Balance Before',
      'Balance After',
      'Remarks',
      'Created By'
    ];

    const rows = filteredTransactions.map(t => [
      t.id,
      new Date(t.createdAt).toLocaleString(),
      t.employee?.employeeNumber || 'N/A',
      `"${t.employee?.firstName || ''} ${t.employee?.lastName || ''}"`,
      `"${t.employee?.office || 'N/A'}"`,
      t.leaveType?.code || t.leaveTypeId,
      t.transactionType,
      t.source,
      t.transactionType === 'Credit' || (t.transactionType === 'Adjustment' && t.amount > 0) ? t.amount.toFixed(3) : '0.000',
      t.transactionType === 'Debit' ? t.amount.toFixed(3) : '0.000',
      t.balanceBefore.toFixed(3),
      t.balanceAfter.toFixed(3),
      `"${t.remarks.replace(/"/g, '""')}"`,
      `"${t.createdBy}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PhilFIDA_Leave_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Leave Ledger exported successfully!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-[#0F2C59]/10 dark:bg-slate-800 text-[#0F2C59] dark:text-amber-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Leave Ledger & Audit Log History
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanent immutable record of all leave credits, debits, adjustments, and accruals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLedgerData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#1B4D3E] hover:bg-[#153e32] dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Immutable Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <p className="font-bold uppercase tracking-wider text-[11px]">Strict Banking & Audit Compliance Principle</p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-300">
            Leave transactions are permanent and <strong>cannot be edited or deleted</strong>. Every balance change generates an explicit ledger record. Corrections are executed strictly via reversal transactions.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, remarks, REF ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] focus:outline-none dark:text-white"
            />
          </div>

          {/* Filter Leave Type */}
          <div className="relative">
            <select
              value={selectedLeaveType}
              onChange={(e) => {
                setSelectedLeaveType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-white focus:outline-none"
            >
              <option value="all">All Leave Types</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.code} - {lt.leaveName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Transaction Type */}
          <div className="relative">
            <select
              value={selectedTxType}
              onChange={(e) => {
                setSelectedTxType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-white focus:outline-none"
            >
              <option value="all">All Transaction Types</option>
              <option value="Credit">Credit (+)</option>
              <option value="Debit">Debit (-)</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Reversal">Reversal</option>
            </select>
          </div>

          {/* Filter Source */}
          <div className="relative">
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-white focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="Beginning Balance">Beginning Balance</option>
              <option value="Leave Application">Leave Application</option>
              <option value="Manual Adjustment">Manual Adjustment</option>
              <option value="CTO">CTO Earned</option>
              <option value="Monthly Accrual">Monthly Accrual</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong>{filteredTransactions.length}</strong> ledger records
          </span>
          {(searchQuery || selectedLeaveType !== 'all' || selectedTxType !== 'all' || selectedSource !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLeaveType('all');
                setSelectedTxType('all');
                setSelectedSource('all');
                setCurrentPage(1);
              }}
              className="text-[#0F2C59] dark:text-amber-400 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Tx Type</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4 text-right text-emerald-700 dark:text-emerald-400">Credit (+)</th>
                <th className="py-3.5 px-4 text-right text-rose-700 dark:text-rose-400">Debit (-)</th>
                <th className="py-3.5 px-4 text-right">Before</th>
                <th className="py-3.5 px-4 text-right font-bold">After</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2C59]" />
                    <p className="text-xs">Loading ledger entries...</p>
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No leave transactions found matching criteria</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isCredit = tx.transactionType === 'Credit' || (tx.transactionType === 'Adjustment' && tx.amount > 0);
                  const isDebit = tx.transactionType === 'Debit';

                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.employee ? `${tx.employee.firstName} ${tx.employee.lastName}` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tx.employee?.employeeNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {tx.leaveType?.code || 'LEAVE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCredit 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isDebit
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}>
                          {isCredit ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{tx.transactionType}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px]">
                        {tx.source}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {isCredit ? `+${tx.amount.toFixed(3)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {isDebit ? `-${tx.amount.toFixed(3)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                        {tx.balanceBefore.toFixed(3)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {tx.balanceAfter.toFixed(3)}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400" title={tx.remarks}>
                        {tx.remarks}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {tx.createdBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
