// PhilFIDA Region VII Collapsible Sidebar Navigation
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Clock,
  History,
  Settings,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileUp,
  Download,
  Paperclip,
  Shield,
  PanelLeftClose,
  PanelLeft,
  X,
  Building2,
} from 'lucide-react';
import { PermissionKey } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

// ─── Navigation items ───────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
  roleRequired?: string;
  group?: string;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { label: 'Dashboard',         href: '/dashboard',                    icon: LayoutDashboard, group: 'Main Navigation' },
  { label: 'Employees',         href: '/dashboard/employees',          icon: Users,         permission: 'employees.view', group: 'Main Navigation' },
  // Leave Management
  { label: 'Leave Requests',    href: '/dashboard/leave-applications', icon: FileText,      permission: 'leave_applications.view_own', group: 'Leave Management' },
  { label: 'Leave Approvals',   href: '/dashboard/leave-approvals',   icon: CheckSquare,   permission: 'leave_applications.approve', group: 'Leave Management', badge: 'Action', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { label: 'CTO Requests',      href: '/dashboard/cto',               icon: Clock,         permission: 'cto.view_own', group: 'Leave Management' },
  { label: 'Leave Ledger',      href: '/dashboard/leave-ledger',      icon: FileSpreadsheet, permission: 'leave_ledger.view', group: 'Leave Management' },
  // Reports & Tools
  { label: 'Reports & Leave Cards', href: '/dashboard/reports',       icon: Printer,       permission: 'reports.view', group: 'Reports & Tools' },
  { label: 'Document Repository',   href: '/dashboard/documents',     icon: Paperclip,     permission: 'documents.manage', group: 'Reports & Tools' },
  { label: 'Employee Import',       href: '/dashboard/import',        icon: FileUp,        permission: 'employees.create', group: 'Reports & Tools' },
  { label: 'Export Center',         href: '/dashboard/export',        icon: Download,      permission: 'data.export', group: 'Reports & Tools' },
  // Administration
  { label: 'Account Management', href: '/dashboard/account-management', icon: Shield,       roleRequired: 'Super Admin', group: 'Administration', badge: 'Admin', badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  { label: 'Audit Logs',        href: '/dashboard/audit-logs',        icon: History,       permission: 'audit_logs.view', group: 'Administration' },
  { label: 'System Settings',   href: '/dashboard/settings',          icon: Settings,      permission: 'settings.manage', group: 'Administration' },
];

const STORAGE_KEY = 'philfida-sidebar-collapsed';

interface SidebarProps {
  isOpen?: boolean;        // mobile drawer open state
  onClose?: () => void;   // close mobile drawer
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, onClose, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, hasPermission, hasRole } = useAuthStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      const collapsed = stored === 'true';
      setIsCollapsed(collapsed);
      onCollapsedChange?.(collapsed);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
    onCollapsedChange?.(next);
  };

  // Filter nav items by permission / role
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.roleRequired) return hasRole(item.roleRequired);
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // Group items
  const groups: Record<string, NavItem[]> = {};
  visibleItems.forEach(item => {
    const g = item.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  const sidebarContent = (isMobile = false) => (
    <aside
      className={cn(
        'h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out relative select-none',
        isMobile
          ? 'w-72'
          : isCollapsed
          ? 'w-[68px]'
          : 'w-64'
      )}
    >
      {/* Mobile Drawer Close Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F2C59] text-amber-400 flex items-center justify-center font-black text-xs border border-amber-400/40">
              R7
            </div>
            <span className="font-extrabold text-sm text-white">PhilFIDA Region VII</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User Context Card */}
      {user && (() => {
        const userCardEl = (
          <div className={cn(
            'm-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center shrink-0 transition-all duration-200 hover:bg-slate-800 hover:border-slate-600',
            isCollapsed && !isMobile ? 'justify-center w-10 h-10 mx-auto p-0' : 'px-3 py-2.5 gap-2.5'
          )}>
            <div className="relative shrink-0">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-amber-400/40 shadow-xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0F2C59] text-amber-400 font-extrabold text-[10px] flex items-center justify-center border border-amber-400/40 shadow-xs">
                  {(user.employeeName || user.username || user.email).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>

            {(!isCollapsed || isMobile) && (
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold truncate text-white">
                  {user.employeeName || user.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[10px] text-amber-300 font-semibold truncate">
                    {user.roleName}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

        if (isCollapsed && !isMobile) {
          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>{userCardEl}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-bold bg-slate-950 border-slate-800 text-slate-100">
                  <div>{user.employeeName || user.username}</div>
                  <div className="text-[10px] text-amber-400 font-normal">{user.roleName}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return userCardEl;
      })()}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
        <TooltipProvider delayDuration={0}>
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="space-y-1">
              {/* Group label — only when expanded */}
              {(!isCollapsed || isMobile) && (
                <div className="flex items-center px-3 pt-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group}
                  </span>
                  <div className="ml-2 flex-1 h-px bg-slate-800" />
                </div>
              )}

              {items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                const linkEl = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={cn(
                      'flex items-center rounded-xl text-xs font-semibold transition-all duration-150 group relative',
                      isCollapsed && !isMobile
                        ? 'justify-center w-10 h-10 mx-auto'
                        : 'px-3.5 py-2.5 justify-between',
                      isActive
                        ? isCollapsed && !isMobile
                          ? 'bg-[#0F2C59] text-amber-400 font-extrabold shadow-md border border-amber-400/40 ring-1 ring-amber-400/20'
                          : 'bg-[#0F2C59] text-amber-400 font-extrabold shadow-md border-l-4 border-amber-400'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    )}
                  >
                    <div className={cn('flex items-center', !isCollapsed || isMobile ? 'space-x-2.5' : '')}>
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                        )}
                      />
                      {(!isCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {(!isCollapsed || isMobile) && (
                      <div className="flex items-center gap-1">
                        {item.badge && (
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full border',
                            item.badgeColor
                          )}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                    )}
                  </Link>
                );

                if (isCollapsed && !isMobile) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs font-bold bg-slate-950 border-slate-800 text-slate-100">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkEl;
              })}
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {/* Bottom Controls */}
      <div className="border-t border-slate-800 p-2 shrink-0 bg-slate-900/90">
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors rounded-xl p-2 w-full hover:bg-slate-800 group',
              isCollapsed ? 'justify-center' : 'px-3 justify-between'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Alt+S
              </span>
            )}
          </button>
        )}

        {/* Agency Footer */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 pt-2 text-center text-[10px] text-slate-400 border-t border-slate-800/80 mt-1">
            <div className="flex items-center justify-center gap-1 font-bold text-amber-400/90">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>PhilFIDA Regional Office VII</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">
              Cebu City &bull; Central Visayas
            </p>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-screen lg:hidden transition-transform duration-300 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-full">
        {sidebarContent(false)}
      </div>
    </>
  );
}

export { STORAGE_KEY as SIDEBAR_STORAGE_KEY };
