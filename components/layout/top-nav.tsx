'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Menu, 
  Bell, 
  Search, 
  Check, 
  ExternalLink,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { Notification } from '@/types';
import { toast } from 'sonner';

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const router = useRouter();
  const { user, logout, isDarkMode, toggleDarkMode } = useAuthStore();

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setNotifications(data.data || []);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (err) {
      console.warn('Failed to mark read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead', userId: user?.id || 'user_emp' }),
      });
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  // Global Search logic
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      const [empRes, appRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/leave-applications'),
      ]);
      const empData = await empRes.json();
      const appData = await appRes.json();

      const q = val.toLowerCase();
      const matches: any[] = [];

      if (empData.success) {
        (empData.data || []).forEach((e: any) => {
          if (`${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`.toLowerCase().includes(q)) {
            matches.push({
              id: e.id,
              type: 'Employee',
              title: `${e.firstName} ${e.lastName}`,
              subtitle: `${e.position} (${e.employeeNumber})`,
              link: `/dashboard/employees/${e.id}`,
            });
          }
        });
      }

      if (appData.success) {
        (appData.data || []).forEach((a: any) => {
          if (`${a.reason} ${a.leaveType?.leaveName} ${a.startDate}`.toLowerCase().includes(q)) {
            matches.push({
              id: a.id,
              type: 'Leave Application',
              title: `${a.leaveType?.code || 'Leave'} Application (${a.status})`,
              subtitle: `Dates: ${a.startDate} to ${a.endDate}`,
              link: '/dashboard/leave-applications',
            });
          }
        });
      }

      setSearchResults(matches.slice(0, 6));
      setShowSearchDropdown(true);
    } catch (err) {
      console.warn('Search error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out from PhilFIDA LCMS.');
    router.push('/login');
  };

  const getRoleBadgeVariant = (roleName?: string) => {
    if (roleName === 'Super Admin') return 'gold';
    if (roleName === 'HR Administrator') return 'navy';
    return 'neutral';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Side: Sidebar Toggle & Branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#0F2C59] flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm border border-amber-400/40">
              PF
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#0F2C59] dark:text-white leading-tight tracking-tight">
                PhilFIDA LCMS
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Leave Credit Management System
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Global Search Input */}
        <div className="relative hidden md:block max-w-sm w-full mx-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees, requests, positions..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] focus:outline-none dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50">
              <div className="p-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                Search Results ({searchResults.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      router.push(item.link);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Notifications & User Info */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notification Center Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50">
                <div className="p-3 bg-[#0F2C59] text-white flex items-center justify-between">
                  <span className="font-bold text-xs">System Notifications ({unreadCount} unread)</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-amber-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">No notifications available</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          handleMarkAsRead(n.id);
                          if (n.link) router.push(n.link);
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-xs cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !n.isRead ? 'bg-amber-50/50 dark:bg-amber-950/20 font-semibold' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="text-slate-900 dark:text-white font-bold">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User Profile Summary */}
          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {getInitials(user.employeeName || user.username)}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {user.employeeName || user.username}
                </span>
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant={getRoleBadgeVariant(user.roleName)}>
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    {user.roleName}
                  </Badge>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
