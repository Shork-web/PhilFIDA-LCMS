'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { SystemSettings, Holiday, HolidayType } from '@/types';
import { PHILFIDA_OFFICES, PHILFIDA_DIVISIONS } from '@/lib/constants';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Calendar, 
  Clock, 
  Building,
  CalendarOff,
  CheckCircle2,
  GitMerge,
  Bell,
  Plus,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function UnifiedSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'policy' | 'cto' | 'offices' | 'holidays' | 'workflow' | 'system'>('policy');

  // System Settings State
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Holidays State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    holidayName: '',
    holidayType: 'Regular' as HolidayType,
    date: new Date().toISOString().split('T')[0],
    region: 'Region VII',
    isRecurring: true,
  });

  const fetchSettingsAndHolidays = async () => {
    try {
      setLoading(true);
      const [setRes, holRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/holidays'),
      ]);

      const setData = await setRes.json();
      const holData = await holRes.json();

      if (setData.success) setSettings(setData.data);
      if (holData.success) setHolidays(holData.data || []);
    } catch (error) {
      toast.error('Failed to load settings configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndHolidays();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          userId: user?.id || 'user_admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        toast.success('System configuration saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Error updating system settings');
    } finally {
      setSaving(false);
    }
  };

  // Holiday Modal Handlers
  const openCreateHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      holidayName: '',
      holidayType: 'Regular',
      date: new Date().toISOString().split('T')[0],
      region: 'Region VII',
      isRecurring: true,
    });
    setIsHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingHoliday ? `/api/holidays/${editingHoliday.id}` : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...holidayForm, userId: user?.id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Holiday ${editingHoliday ? 'updated' : 'added'} successfully!`);
        setIsHolidayModalOpen(false);
        fetchSettingsAndHolidays();
      }
    } catch (err) {
      toast.error('Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Delete holiday "${name}"?`)) return;
    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
      if ((await res.json()).success) {
        toast.success('Holiday deleted');
        fetchSettingsAndHolidays();
      }
    } catch (err) {
      toast.error('Delete error');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0F2C59]" />
        <p className="text-xs font-semibold text-slate-600">Loading PhilFIDA Region VII configuration hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              PhilFIDA Region VII Consolidated Settings Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Centralized administration for leave policies, CTO rates, Region VII offices, public holidays, and approval workflows
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettingsAndHolidays}
          className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          title="Refresh Settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'policy' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Accrual & Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('cto')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'cto' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>CTO Conversion</span>
        </button>

        <button
          onClick={() => setActiveTab('offices')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'offices' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Region VII Offices</span>
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'holidays' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarOff className="w-3.5 h-3.5" />
          <span>Public Holidays</span>
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'workflow' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Approval Workflow</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition ${
            activeTab === 'system' ? 'bg-[#0F2C59] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>System Preferences</span>
        </button>
      </div>

      {/* TAB CONTENT PANELS */}
      {settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* TAB 1: ACCRUAL & POLICY RULES */}
          {activeTab === 'policy' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sliders className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Civil Service Credit Accrual & Leave Policy Rules</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Monthly Vacation Leave Rate (Days)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={settings.monthlyVacationLeave}
                    onChange={(e) => setSettings({ ...settings, monthlyVacationLeave: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Monthly Sick Leave Rate (Days)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={settings.monthlySickLeave}
                    onChange={(e) => setSettings({ ...settings, monthlySickLeave: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Require Medical Attachment After (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={settings.requireAttachmentAfterDays}
                    onChange={(e) => setSettings({ ...settings, requireAttachmentAfterDays: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Enable Half-Day Leave Filing (0.5 Day)</span>
                    <span className="text-[11px] text-slate-500">Permit Region VII staff to file half-day leaves</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableHalfDayLeave}
                    onChange={(e) => setSettings({ ...settings, enableHalfDayLeave: e.target.checked })}
                    className="w-4 h-4 accent-[#0F2C59]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Enable Holiday Duration Exclusions</span>
                    <span className="text-[11px] text-slate-500">Exclude public holidays automatically from leave duration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableHolidayValidation}
                    onChange={(e) => setSettings({ ...settings, enableHolidayValidation: e.target.checked })}
                    className="w-4 h-4 accent-[#0F2C59]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: CTO CONVERSION */}
          {activeTab === 'cto' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Compensatory Time Off (CTO) Conversion Rules</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Overtime Hours Required Per 1.0 Day Credit
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={settings.ctoHoursPerDay}
                    onChange={(e) => setSettings({ ...settings, ctoHoursPerDay: parseFloat(e.target.value) || 8 })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Default Civil Service rate: 8 overtime hours = 1.0 day leave credit.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGION VII OFFICES & UNITS */}
          {activeTab === 'offices' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">PhilFIDA Regional Office VII Structure & Units</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Station List */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase">Regional Stations & Field Offices</h3>
                  <ul className="space-y-2">
                    {PHILFIDA_OFFICES.map((off, idx) => (
                      <li key={idx} className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>{off}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">Active Station</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Units & Sections */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase">Operational Units & Sections</h3>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-60 overflow-y-auto pr-1">
                    {PHILFIDA_DIVISIONS.map((div, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{div}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLIC HOLIDAYS */}
          {activeTab === 'holidays' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CalendarOff className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">Region VII Public Holidays List ({holidays.length})</h2>
                </div>
                <button
                  type="button"
                  onClick={openCreateHoliday}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F2C59] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#1E407C]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Public Holiday</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-900 dark:text-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Holiday Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{h.holidayName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                            {h.holidayType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{h.date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{h.region || 'Region VII'}</td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h.id, h.holidayName)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: APPROVAL WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <GitMerge className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Multi-Level Leave Approval Workflow Matrix</h2>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="font-bold text-xs text-[#0F2C59] dark:text-amber-400 uppercase tracking-wider">
                  Configured Approval Sequence for Region VII Staff
                </h3>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-1 text-center shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stage 1</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Employee Filing</span>
                    <span className="text-[11px] text-slate-500">Submits request & attachment</span>
                  </div>

                  <span className="font-bold text-slate-400 text-lg">→</span>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 flex-1 text-center shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-amber-600 block mb-1">Stage 2</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">Supervisor Review</span>
                    <span className="text-[11px] text-slate-500">Unit / Section Head Endorsement</span>
                  </div>

                  <span className="font-bold text-slate-400 text-lg">→</span>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 flex-1 text-center shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-1">Stage 3</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">HR Admin Approval</span>
                    <span className="text-[11px] text-slate-500">Final Credit Ledger Deduction</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM PREFERENCES */}
          {activeTab === 'system' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Bell className="w-5 h-5 text-[#0F2C59] dark:text-amber-400" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">System Automation & Notification Switches</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Enable Automatic Monthly Accrual</span>
                    <span className="text-[11px] text-slate-500">Activate end-of-month automatic credit engine</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableAutomaticMonthlyCredits}
                    onChange={(e) => setSettings({ ...settings, enableAutomaticMonthlyCredits: e.target.checked })}
                    className="w-4 h-4 accent-[#0F2C59]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Allow Negative Balances</span>
                    <span className="text-[11px] text-slate-500">Permit leave debits beyond zero balance (Not Recommended)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowNegativeBalance}
                    onChange={(e) => setSettings({ ...settings, allowNegativeBalance: e.target.checked })}
                    className="w-4 h-4 accent-rose-600"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SAVE BUTTON BAR */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-md transition disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Configurations</span>
            </button>
          </div>
        </form>
      )}

      {/* CREATE HOLIDAY MODAL */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0F2C59] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Region VII Public Holiday</h3>
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Charter Day, Independence Day"
                  value={holidayForm.holidayName}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Type</label>
                  <select
                    value={holidayForm.holidayType}
                    onChange={(e) => setHolidayForm({ ...holidayForm, holidayType: e.target.value as HolidayType })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Special">Special Non-Working</option>
                    <option value="Local">Local / Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-[#0F2C59]"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
