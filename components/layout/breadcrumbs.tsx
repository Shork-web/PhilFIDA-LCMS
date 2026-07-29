'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const getBreadcrumbLabel = (segment: string) => {
    switch (segment) {
      case 'dashboard':
        return 'Dashboard';
      case 'employees':
        return 'Employee Directory';
      case 'users':
        return 'User Accounts';
      case 'roles':
        return 'Roles & Access Control';
      case 'leave-types':
        return 'Leave Categories';
      case 'profile':
        return 'My Profile';
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }
  };

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-[#0F2C59] dark:hover:text-blue-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const label = getBreadcrumbLabel(segment);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-white">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-[#0F2C59] dark:hover:text-blue-400 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
