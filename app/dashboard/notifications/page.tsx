'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Notification } from '@/types';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  RefreshCw, 
  ExternalLink,
  CalendarCheck,
  RotateCw,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?userId=${user?.id || 'user_emp'}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark notification read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead', userId: user?.id || 'user_emp' }),
      });
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type: string) => {
    if (type === 'Leave Approved') return <CalendarCheck className="w-5 h-5 text-emerald-500" />;
    if (type === 'CTO Approved') return <CalendarCheck className="w-5 h-5 text-indigo-500" />;
    if (type === 'Monthly Accrual') return <RotateCw className="w-5 h-5 text-blue-500" />;
    if (type === 'Manual Adjustment') return <Sliders className="w-5 h-5 text-amber-500" />;
    return <Bell className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-slate-800 dark:text-amber-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              System Notification Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time automated alerts for leave approvals, CTO credits, adjustments, and monthly accruals
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchNotifications}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F2C59] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#1E407C] transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-2 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-md transition ${filter === 'all' ? 'bg-[#0F2C59] text-white shadow-2xs font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-md transition ${filter === 'unread' ? 'bg-[#0F2C59] text-white shadow-2xs font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Unread Only ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F2C59]" />
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                !n.isRead ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getNotifIcon(n.type)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {n.link && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(n.id);
                      router.push(n.link!);
                    }}
                    className="p-1.5 text-xs text-[#0F2C59] dark:text-amber-400 hover:underline flex items-center space-x-1"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
