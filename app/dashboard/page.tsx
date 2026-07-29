'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatDate } from '@/lib/utils';
import {
  Users,
  UserCheck,
  CalendarDays,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Briefcase,
  CheckCircle2,
  Award,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  SlidersHorizontal,
  History,
  RotateCw,
  Printer,
  Bell,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { DashboardStats, LeaveBalance, LeaveTransaction, LeaveApplication } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myBalances, setMyBalances] = useState<LeaveBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<LeaveTransaction[]>([]);
  const [recentApplications, setRecentApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrHR = user?.roleName === 'Super Admin' || user?.roleName === 'HR Administrator';

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [
          fetch('/api/leave-transactions'),
          fetch('/api/leave-applications'),
        ];

        if (isAdminOrHR) {
          promises.push(fetch('/api/dashboard/stats'));
        }

        if (user?.employeeId) {
          promises.push(fetch(`/api/leave-balances?employeeId=${user.employeeId}`));
        }

        const results = await Promise.all(promises);
        const txData = await results[0].json();
        const appData = await results[1].json();

        if (txData.success) {
          setRecentTransactions((txData.data || []).slice(0, 5));
        }

        if (appData.success) {
          setRecentApplications((appData.data || []).slice(0, 5));
        }

        if (isAdminOrHR && results[2]) {
          const statsData = await results[2].json();
          if (statsData.success) setStats(statsData.data);
        }

        const balRes = results.find(r => r.url?.includes('leave-balances'));
        if (balRes) {
          const balData = await balRes.json();
          if (balData.success) setMyBalances(balData.data);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user, isAdminOrHR]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculate Phase 3 Dashboard Analytics
  const pendingAppsCount = recentApplications.filter(a => a.status === 'Pending').length;

  return (
    <div className="space-y-8">
      {/* Welcome Agency Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F2C59] via-[#1B4D3E] to-[#0A1F3F] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mabuhay, {user?.employeeName || user?.username}!
            </h1>
            <p className="text-sm text-slate-200 mt-1 max-w-2xl">
              {isAdminOrHR
                ? 'Automated agency leave credit management portal featuring monthly accruals, policy settings, holiday calendars, CSC Form 6 leave cards, and real-time notifications.'
                : 'Welcome to your PhilFIDA leave portal. Apply for leave, view accumulated Civil Service credits, file CTO hours, inspect leave cards, and view public holidays.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" className="px-3 py-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {user?.roleName}
            </Badge>
            {user?.office && (
              <Badge variant="navy" className="px-3 py-1 text-xs bg-white/20 text-white border-white/30">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                {user.office.split('(')[0]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Summary Cards (Phase 3 Feature 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Active Staff</span>
            <Users className="w-4 h-4 text-[#0F2C59] dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {stats?.activeEmployees ?? 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">PhilFIDA Central & Regional Offices</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Pending Leave Apps</span>
            <CheckSquare className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-600">
            {pendingAppsCount}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting HR approval</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Credit Rate</span>
            <RotateCw className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-600">
            +2.50
          </div>
          <p className="text-[10px] text-slate-500 mt-1">1.25 VL + 1.25 SL / Month</p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Ledger Transactions</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-slate-900 dark:text-white">
            {recentTransactions.length}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Immutable audit records</p>
        </Card>
      </div>

      {/* Quick Access Action Shortcuts Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Phase 3 Automation & Policy Navigation Shortcuts
        </span>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/leave-applications">
            <Button size="sm" variant="primary" className="bg-[#0F2C59] hover:bg-[#1E407C]">
              <FileText className="w-4 h-4 mr-1.5" /> Apply for Leave
            </Button>
          </Link>

          {isAdminOrHR && (
            <Link href="/dashboard/monthly-accrual">
              <Button size="sm" variant="secondary" className="bg-[#1B4D3E] text-white hover:bg-[#153e32]">
                <RotateCw className="w-4 h-4 mr-1.5" /> Monthly Accrual Engine
              </Button>
            </Link>
          )}

          <Link href="/dashboard/calendar">
            <Button size="sm" variant="outline">
              <Calendar className="w-4 h-4 mr-1.5 text-blue-600" /> Agency Leave Calendar
            </Button>
          </Link>

          <Link href="/dashboard/reports">
            <Button size="sm" variant="outline">
              <Printer className="w-4 h-4 mr-1.5 text-purple-600" /> CSC Leave Cards & Reports
            </Button>
          </Link>

          {isAdminOrHR && (
            <Link href="/dashboard/settings">
              <Button size="sm" variant="outline">
                <SlidersHorizontal className="w-4 h-4 mr-1.5 text-[#0F2C59]" /> System Settings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* MY LEAVE CREDIT BALANCES CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Accumulated CSC Leave Credit Balances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed value from permanent immutable leave transaction history.
            </p>
          </div>
          <Link href="/dashboard/reports">
            <Button size="sm" variant="ghost" className="text-xs">
              Generate Printable Leave Card <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {myBalances.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <p className="text-sm">No leave balances found for this account.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {myBalances.map((bal) => (
              <Card
                key={bal.id}
                className="hover:shadow-md transition-all border-slate-200 dark:border-slate-800"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="navy" className="text-xs font-bold px-2.5 py-0.5">
                      {bal.leaveType?.code || 'LEAVE'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">CSC Credit</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {bal.leaveType?.leaveName || 'Leave Category'}
                  </h4>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-[#0F2C59] dark:text-amber-400 font-mono">
                      {formatNumber(bal.balance)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Days</span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 truncate">
                    Updated: {new Date(bal.lastUpdated).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY & AUDIT WIDGET GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Latest Transactions (Ledger) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#0F2C59] dark:text-amber-400" />
                Recent Ledger Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                Latest immutable credit and debit entries
              </CardDescription>
            </div>
            <Link href="/dashboard/leave-ledger">
              <Button size="sm" variant="ghost" className="text-xs">
                View Ledger <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No transactions logged yet</p>
            ) : (
              recentTransactions.map((tx) => {
                const isCredit = tx.transactionType === 'Credit' || (tx.transactionType === 'Adjustment' && tx.amount > 0);
                return (
                  <div key={tx.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {tx.employee ? `${tx.employee.firstName} ${tx.employee.lastName}` : 'N/A'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-bold">
                          {tx.leaveType?.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{tx.remarks}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? `+${tx.amount.toFixed(3)}` : `-${tx.amount.toFixed(3)}`}
                      </span>
                      <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Widget 2: Latest Leave Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1B4D3E] dark:text-emerald-400" />
                Latest Leave Requests
              </CardTitle>
              <CardDescription className="text-xs">
                Recent employee applications & status
              </CardDescription>
            </div>
            <Link href="/dashboard/leave-applications">
              <Button size="sm" variant="ghost" className="text-xs">
                View Applications <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {recentApplications.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No leave requests filed yet</p>
            ) : (
              recentApplications.map((app) => (
                <div key={app.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs transition">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {app.employee ? `${app.employee.firstName} ${app.employee.lastName}` : 'N/A'}
                      </span>
                      <span className="font-semibold text-slate-500">
                        ({app.leaveType?.code})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {app.startDate} to {app.endDate} ({app.numberOfDays} days)
                    </p>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    app.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : app.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
