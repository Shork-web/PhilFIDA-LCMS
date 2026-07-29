'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/auth-store';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { toast } from 'sonner';
import {
  UserCheck, UserX, Shield, Users, Clock, Ban, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Search, ChevronDown, Link2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
};



type AccountTab = 'pending' | 'active' | 'disabled' | 'rejected';

const TABS: { id: AccountTab; label: string; icon: React.ComponentType<{className?: string}>; color: string }[] = [
  { id: 'pending',  label: 'Pending Approval', icon: Clock,       color: 'text-amber-400' },
  { id: 'active',   label: 'Active Accounts',  icon: CheckCircle2, color: 'text-emerald-400' },
  { id: 'disabled', label: 'Disabled',          icon: Ban,          color: 'text-slate-400' },
  { id: 'rejected', label: 'Rejected',           icon: XCircle,     color: 'text-red-400' },
];

const ROLE_OPTIONS = [
  { id: 'role_superadmin', label: 'Super Admin - IT/MIS' },
  { id: 'role_hradmin',    label: 'Admin / Administrative Unit' },
  { id: 'role_supervisor', label: 'Supervisor - Regional Director' },
  { id: 'role_employee',   label: 'Employee - Staff' },
];

export default function AccountManagementPage() {
  const { user: authUser, hasRole } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>('pending');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Role promotion state
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('role_employee');

  // Guard: Super Admin only
  useEffect(() => {
    if (authUser && !hasRole('Super Admin')) {
      router.replace('/dashboard');
    }
  }, [authUser, hasRole, router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to load users');
      }
      setUsers(data.data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filteredUsers = users.filter(u => {
    const matchTab = (() => {
      switch (activeTab) {
        case 'pending':  return u.accountStatus === 'Pending';
        case 'active':   return u.accountStatus === 'Active';
        case 'disabled': return u.accountStatus === 'Disabled';
        case 'rejected': return u.accountStatus === 'Rejected';
      }
    })();
    if (!matchTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName || u.username)?.toLowerCase().includes(q)
    );
  });

  const patchUser = async (userId: string, action: string, extra: Record<string, any> = {}) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, actorId: authUser?.id, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast.success(data.message || 'Action completed successfully');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
      setPromotingUser(null);
    }
  };

  const tabCounts = {
    pending:  users.filter(u => u.accountStatus === 'Pending').length,
    active:   users.filter(u => u.accountStatus === 'Active').length,
    disabled: users.filter(u => u.accountStatus === 'Disabled').length,
    rejected: users.filter(u => u.accountStatus === 'Rejected').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':   return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
      case 'Pending':  return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
      case 'Disabled': return 'bg-slate-400/10 text-slate-400 border border-slate-400/20';
      case 'Rejected': return 'bg-red-400/10 text-red-400 border border-red-400/20';
      default:         return 'bg-slate-700 text-slate-300';
    }
  };

  const getAuthProviderBadge = (provider?: string) => {
    if (provider === 'google') return { label: 'Google', color: 'text-blue-400' };
    return { label: 'Email', color: 'text-slate-400' };
  };

  if (!authUser || !hasRole('Super Admin')) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-500" />
          Account Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review registrations, approve accounts, assign roles, and manage user access.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <div key={tab.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{tab.label}</span>
              <tab.icon className={cn('w-4 h-4', tab.color)} />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{tabCounts[tab.id]}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-500 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <tab.icon className={cn('w-3.5 h-3.5', activeTab === tab.id ? tab.color : '')} />
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black',
                  activeTab === tab.id ? 'bg-amber-400 text-[#0F2C59]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                )}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center px-3">
            <button
              onClick={loadUsers}
              className="text-slate-400 hover:text-amber-400 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {search ? 'No users match your search.' : `No ${activeTab} accounts.`}
              </p>
            </div>
          ) : (
            filteredUsers.map(u => {
              const provider = getAuthProviderBadge(u.authProvider);
              const isActioning = actionLoading?.startsWith(u.id);
              const isPromoting = promotingUser === u.id;

              return (
                <div key={u.id} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Avatar + Info */}
                    <div className="flex items-start gap-3 flex-1">
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0F2C59] text-amber-300 font-black text-sm flex items-center justify-center shrink-0">
                          {(u.displayName || u.username || u.email).substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {u.displayName || u.username || u.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', getStatusBadge(u.accountStatus))}>
                            {u.accountStatus}
                          </span>
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800', provider.color)}>
                            {provider.label}
                          </span>
                          {u.role && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {u.role.roleName}
                            </span>
                          )}
                          {u.employeeId && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Link2 className="w-2.5 h-2.5" /> Linked
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Registered {u.createdAt ? fmtDate(u.createdAt) : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:shrink-0">
                      {activeTab === 'pending' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-1">Role:</span>
                            <select
                              value={promotingUser === u.id ? selectedRole : (u.roleId || 'role_employee')}
                              onChange={e => {
                                setPromotingUser(u.id);
                                setSelectedRole(e.target.value);
                              }}
                              className="text-xs font-semibold rounded border-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 focus:ring-1 focus:ring-amber-400"
                            >
                              {ROLE_OPTIONS.map(r => (
                                <option key={r.id} value={r.id}>{r.label}</option>
                              ))}
                            </select>
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={actionLoading === u.id + 'approve'}
                            onClick={() => patchUser(u.id, 'approve', { roleId: promotingUser === u.id ? selectedRole : (u.roleId || 'role_employee') })}
                            className="text-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actionLoading === u.id + 'reject'}
                            onClick={() => patchUser(u.id, 'reject')}
                            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}

                      {activeTab === 'active' && (
                        <>
                          {/* Role Promotion */}
                          {isPromoting ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={selectedRole}
                                onChange={e => setSelectedRole(e.target.value)}
                                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                              >
                                {ROLE_OPTIONS.map(r => (
                                  <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={actionLoading === u.id + 'promote'}
                                onClick={() => patchUser(u.id, 'promote', { roleId: selectedRole })}
                                className="text-xs"
                              >
                                Save
                              </Button>
                              <button
                                onClick={() => setPromotingUser(null)}
                                className="text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setPromotingUser(u.id); setSelectedRole(u.roleId); }}
                              className="text-xs"
                            >
                              <Shield className="w-3.5 h-3.5 mr-1" /> Change Role
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actionLoading === u.id + 'disable'}
                            onClick={() => patchUser(u.id, 'disable')}
                            className="text-xs border-slate-300 text-slate-500"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" /> Disable
                          </Button>
                        </>
                      )}

                      {(activeTab === 'disabled' || activeTab === 'rejected') && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={actionLoading === u.id + 'reactivate'}
                            onClick={() => patchUser(u.id, 'reactivate')}
                            className="text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reactivate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actionLoading === u.id + 'delete'}
                            onClick={() => {
                              if (confirm(`WARNING: Are you sure you want to PERMANENTLY DELETE the account for "${u.displayName || u.username || u.email}"? This action cannot be undone.`)) {
                                patchUser(u.id, 'delete');
                              }
                            }}
                            className="text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" /> Delete Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
