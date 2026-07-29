'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Holiday, HolidayType } from '@/types';
import { PHILFIDA_OFFICES } from '@/lib/constants';
import { 
  CalendarOff, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Search, 
  Calendar, 
  MapPin, 
  Repeat, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    holidayName: '',
    holidayType: 'Regular' as HolidayType,
    date: '',
    region: '',
    isRecurring: true,
  });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/holidays');
      const data = await res.json();
      if (data.success) {
        setHolidays(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const openCreateModal = () => {
    setEditingHoliday(null);
    setFormData({
      holidayName: '',
      holidayType: 'Regular',
      date: new Date().toISOString().split('T')[0],
      region: '',
      isRecurring: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (h: Holiday) => {
    setEditingHoliday(h);
    setFormData({
      holidayName: h.holidayName,
      holidayType: h.holidayType,
      date: h.date,
      region: h.region || '',
      isRecurring: h.isRecurring,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.holidayName || !formData.date) {
      toast.error('Holiday name and date are required');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingHoliday ? `/api/holidays/${editingHoliday.id}` : '/api/holidays';
      const method = editingHoliday ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || 'user_admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Holiday ${editingHoliday ? 'updated' : 'added'} successfully!`);
        setIsModalOpen(false);
        fetchHolidays();
      } else {
        toast.error(data.message || 'Failed to save holiday');
      }
    } catch (error) {
      toast.error('Error processing holiday record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the holiday: "${name}"?`)) return;

    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Holiday deleted successfully');
        fetchHolidays();
      } else {
        toast.error(data.message || 'Failed to delete holiday');
      }
    } catch (error) {
      toast.error('Error deleting holiday');
    }
  };

  const filteredHolidays = holidays.filter(h => {
    const matchesSearch = h.holidayName.toLowerCase().includes(searchQuery.toLowerCase()) || h.date.includes(searchQuery);
    const matchesType = typeFilter === 'all' || h.holidayType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <CalendarOff className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Official Public Holidays Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage regular, special, and regional holidays. Leave application duration calculations automatically exclude official holidays.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHolidays}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2C59] hover:bg-[#1E407C] rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Official Holiday</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search holiday name or YYYY-MM-DD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none dark:text-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-white"
        >
          <option value="all">All Holiday Types</option>
          <option value="Regular">Regular Holidays</option>
          <option value="Special">Special Non-Working</option>
          <option value="Local">Local / Regional</option>
        </select>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2C59]" />
            <p className="text-xs text-slate-500">Loading holidays...</p>
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <CalendarOff className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No holidays found</p>
          </div>
        ) : (
          filteredHolidays.map((h) => (
            <div
              key={h.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative hover:border-[#0F2C59] transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    h.holidayType === 'Regular'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : h.holidayType === 'Special'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}>
                    {h.holidayType} Holiday
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {h.holidayName}
                  </h3>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(h)}
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                    title="Edit Holiday"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id, h.holidayName)}
                    className="p-1 text-rose-500 hover:text-rose-700 transition"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
                  <span>{h.date}</span>
                </span>

                {h.isRecurring && (
                  <span className="text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <Repeat className="w-3 h-3" />
                    <span>Annual</span>
                  </span>
                )}
              </div>

              {h.region && (
                <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>Scope: {h.region}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT HOLIDAY MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0F2C59] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingHoliday ? 'Edit Official Holiday' : 'Add New Public Holiday'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Eid al-Fitr"
                  value={formData.holidayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, holidayName: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Holiday Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.holidayType}
                    onChange={(e) => setFormData(prev => ({ ...prev, holidayType: e.target.value as HolidayType }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Special">Special Non-Working</option>
                    <option value="Local">Local / Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Regional Scope (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regional Office V (Bicol), Central Office, Nationwide"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 accent-[#0F2C59]"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Recurring Annual Holiday</span>
              </label>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-white bg-[#0F2C59] hover:bg-[#1E407C] shadow-xs transition disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Holiday Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
