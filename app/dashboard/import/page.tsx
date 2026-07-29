'use client';

import React, { useState } from 'react';
import { 
  FileUp, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileSpreadsheet, 
  Check, 
  Users, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPage() {
  const [csvText, setCsvText] = useState('');
  const [previewSummary, setPreviewSummary] = useState<any | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);

  const sampleCSV = `Employee Number,First Name,Middle Name,Last Name,Suffix,Email,Contact Number,Office,Division,Position,Appointment Type,Appointment Date,Beginning VL,Beginning SL,Beginning CTO
PF-R7-2026-0201,Carlos,Mendoza,Cruz,,carlos.cruz@philfida.da.gov.ph,+63 917 111 2222,PhilFIDA Regional Office VII - Cebu HQ,Administrative & Finance Unit,Accountant II,Permanent,2022-01-15,15.500,10.250,2.000
PF-R7-2026-0202,Elena,Ramos,Bautista,,elena.bautista@philfida.da.gov.ph,+63 918 333 4444,PhilFIDA Regional Office VII - Cebu HQ,Technical Services Unit,Fiber Technologist I,Permanent,2023-05-10,8.000,6.000,0.000`;

  const handleLoadSample = () => {
    setCsvText(sampleCSV);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      toast.error('Please paste or load CSV content first');
      return;
    }

    try {
      setLoadingPreview(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', csvText }),
      });

      const data = await res.json();
      if (data.success) {
        setPreviewSummary(data.data.summary);
        setPreviewRows(data.data.rows || []);
        toast.success(`CSV parsed! ${data.data.summary.validRows} valid rows found.`);
      } else {
        toast.error(data.message || 'Failed to parse CSV');
      }
    } catch (err) {
      toast.error('Error parsing CSV file');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewRows || previewRows.length === 0) return;

    if (!confirm(`Import ${previewRows.length} employee records and initialize beginning leave balances?`)) {
      return;
    }

    try {
      setImporting(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          rows: previewRows,
          processedBy: 'admin@philfida.da.gov.ph',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Import completed successfully! ${data.data.successCount} employees encoded.`);
        setPreviewSummary(null);
        setPreviewRows([]);
        setCsvText('');
      } else {
        toast.error(data.message || 'Import execution failed');
      }
    } catch (err) {
      toast.error('Error executing batch import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Employee Batch Migration & Beginning Balances Tool
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Batch import PhilFIDA Region VII employee records and initialize beginning Vacation Leave, Sick Leave, and CTO balances
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadSample}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Sample CSV Format</span>
        </button>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-bold text-xs text-slate-900 dark:text-white uppercase">
            Paste Raw Employee CSV Content
          </label>
          <span className="text-[10px] text-slate-400 font-mono">Header columns: Employee Number, First Name, Last Name, Email, Office...</span>
        </div>

        <textarea
          rows={6}
          placeholder="Paste CSV file contents here..."
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
        />

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handlePreview}
            disabled={loadingPreview || !csvText.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-md transition disabled:opacity-50"
          >
            {loadingPreview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Parse & Validate CSV</span>
          </button>
        </div>
      </div>

      {/* Validation Summary & Preview Table */}
      {previewSummary && (
        <div className="space-y-6">
          {/* Summary Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Rows</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono block mt-1">{previewSummary.totalRows}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Valid Records</span>
              <span className="text-xl font-black text-emerald-600 font-mono block mt-1">{previewSummary.validRows}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase">Duplicates</span>
              <span className="text-xl font-black text-amber-500 font-mono block mt-1">{previewSummary.duplicateCount}</span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase">Validation Errors</span>
              <span className="text-xl font-black text-rose-600 font-mono block mt-1">{previewSummary.errorCount}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ready to encode valid employee records and initialize beginning balance ledger entries.
            </span>
            <button
              onClick={handleExecuteImport}
              disabled={importing || previewSummary.validRows === 0}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition disabled:opacity-50"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm & Batch Import Employees</span>
            </button>
          </div>

          {/* Preview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Import Row Preview ({previewRows.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-900 dark:text-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee No.</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Division</th>
                    <th className="py-3 px-4 text-right">Beg. VL</th>
                    <th className="py-3 px-4 text-right">Beg. SL</th>
                    <th className="py-3 px-4 text-right">Beg. CTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-[11px]">{row.employeeNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{row.firstName} {row.lastName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{row.email}</td>
                      <td className="py-3 px-4">{row.division}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+{row.beginningVL.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+{row.beginningSL.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+{row.beginningCTO.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
