'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber, getInitials } from '@/lib/utils';
import { UserCircle, Shield, Award, Building2, Calendar, Mail, Phone, Briefcase, Sparkles } from 'lucide-react';
import { LeaveBalance } from '@/types';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/leave-balances?employeeId=${user.employeeId}`);
        const data = await res.json();
        if (data.success) setBalances(data.data);
      } catch (err) {
        console.error('Failed to load employee balances:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <Card className="overflow-hidden border-none bg-gradient-to-r from-[#0F2C59] via-[#0A1F3F] to-slate-900 text-white shadow-xl">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center border-4 border-white/20 shadow-xl flex-shrink-0">
            {getInitials(user.employeeName || user.username)}
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {user.employeeName || user.username}
              </h1>
              <Badge variant="gold" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                {user.roleName}
              </Badge>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              Employee ID: {user.employeeNumber || 'PF-SYS-001'} &bull; {user.email}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                {user.position || 'Agency Staff'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {user.division || 'Administrative Division'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Personnel Details & Leave Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F2C59]" />
              Official Station & Service Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Station Office:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {user.office || 'Central Office (Quezon City)'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Division / Unit:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {user.division || 'Administrative Division'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Position Title:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {user.position || 'Administrative Officer'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">System Role:</span>
              <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {user.roleName}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balances Grid */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Civil Service Leave Credit Balances
            </CardTitle>
            <CardDescription>
              Accumulated leave credits updated per Civil Service Commission (CSC) guidelines.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : balances.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No leave balance records found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {balances.map((bal) => (
                  <div
                    key={bal.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <Badge variant="navy" className="font-mono text-[10px]">
                        {bal.leaveType?.code || 'LEAVE'}
                      </Badge>
                      <h4 className="font-bold text-slate-900 dark:text-white mt-1">
                        {bal.leaveType?.leaveName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-[#0F2C59] dark:text-amber-400">
                        {formatNumber(bal.balance)}
                      </span>
                      <span className="block text-[10px] text-slate-400">Days Credit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
