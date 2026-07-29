'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Info, 
  X, 
  User, 
  Clock,
  CheckCircle2,
  CalendarOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026 default seed month
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?month=${month + 1}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [month, year]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to format date string YYYY-MM-DD
  const formatDateKey = (dayNumber: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNumber).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Agency Leave & Holiday Calendar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive month grid mapping approved agency leaves, pending requests, and official public holidays
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCalendarEvents}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Month Navigation & Color Legend */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>

          <h2 className="text-base font-extrabold text-[#0F2C59] dark:text-amber-400 min-w-44 text-center">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">Approved Leave</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-700 dark:text-slate-300">Pending Request</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-700 dark:text-slate-300">Regular Holiday</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-700 dark:text-slate-300">Special Holiday</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
          <div className="text-rose-600 dark:text-rose-400">Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-indigo-600 dark:text-indigo-400">Sat</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {/* Empty cells before day 1 */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-28 bg-slate-50/50 dark:bg-slate-950/30 p-2 opacity-50" />
          ))}

          {/* Days of the Month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNumber = idx + 1;
            const dateStr = formatDateKey(dayNumber);

            // Filter events that match this date
            const dayEvents = events.filter((ev) => {
              if (ev.date === dateStr) return true;
              if (ev.startDate && ev.endDate) {
                return dateStr >= ev.startDate && dateStr <= ev.endDate;
              }
              return false;
            });

            return (
              <div
                key={`day-${dayNumber}`}
                className="min-h-28 p-2 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>{dayNumber}</span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">({dayEvents.length})</span>
                  )}
                </div>

                <div className="space-y-1 mt-1 flex-1 overflow-y-auto">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-1.5 rounded text-[10px] font-semibold cursor-pointer truncate shadow-2xs transition ${
                        ev.type === 'Holiday'
                          ? ev.color === 'rose'
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-l-2 border-rose-600'
                            : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-l-2 border-purple-600'
                          : ev.color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-l-2 border-emerald-600'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-l-2 border-amber-600'
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0F2C59] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{selectedEvent.type} Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedEvent.title}</h4>
                {selectedEvent.details?.employeeName && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Employee: <strong>{selectedEvent.details.employeeName}</strong>
                  </p>
                )}
                {selectedEvent.details?.leaveType && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Leave Type: <strong>{selectedEvent.details.leaveType}</strong> ({selectedEvent.details.days} days)
                  </p>
                )}
                {selectedEvent.startDate && (
                  <p className="text-slate-500 font-mono">
                    Inclusive Dates: {selectedEvent.startDate} to {selectedEvent.endDate}
                  </p>
                )}
                {selectedEvent.date && (
                  <p className="text-slate-500 font-mono">Date: {selectedEvent.date}</p>
                )}
              </div>

              {selectedEvent.details?.reason && (
                <div className="text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Reason:</span> {selectedEvent.details.reason}
                </div>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-[#0F2C59]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
