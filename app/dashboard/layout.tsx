'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth-store';
import { GovHeader } from '@/components/layout/gov-header';
import { TopNav } from '@/components/layout/top-nav';
import { Sidebar, SIDEBAR_STORAGE_KEY } from '@/components/layout/sidebar';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapsed
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Hydrate collapsed state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setCheckingAuth(false);
    }
  }, [isAuthenticated, router]);

  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wider uppercase text-slate-300">
            Verifying Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      <GovHeader />
      <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main content — adjusts based on sidebar state */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
