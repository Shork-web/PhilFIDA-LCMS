'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/features/auth/auth-store';
import { GovHeader } from '@/components/layout/gov-header';
import { Button } from '@/components/ui/button';
import { Clock, ShieldCheck, LogOut, Mail, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();

  const [checking, setChecking] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    status: 'pending' | 'approved' | 'rejected' | 'disabled';
    message: string;
    userData?: any;
  } | null>(null);

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
    } catch {/* ignore */}
    logout();
    router.push('/login');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      let currentAccount = null;

      if (user?.id) {
        const res = await fetch(`/api/users/${user.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          currentAccount = data.data;
        }
      }

      if (!currentAccount && user?.email) {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          currentAccount = data.data.find((u: any) => u.email.toLowerCase() === user.email.toLowerCase());
        }
      }

      if (currentAccount) {
        if (currentAccount.accountStatus === 'Active' || currentAccount.isActive) {
          setStatusResult({
            status: 'approved',
            message: '🎉 Congratulations! Your account has been approved by the Administrator.',
            userData: currentAccount,
          });
        } else if (currentAccount.accountStatus === 'Rejected') {
          setStatusResult({
            status: 'rejected',
            message: 'Your registration was not approved. Please contact HR for assistance.',
          });
        } else if (currentAccount.accountStatus === 'Disabled') {
          setStatusResult({
            status: 'disabled',
            message: 'Your user account is currently disabled. Please contact your HR Administrator.',
          });
        } else {
          setStatusResult({
            status: 'pending',
            message: 'Your registration is still pending review by the IT / Administrative Unit. Please check back shortly.',
          });
        }
      } else {
        setStatusResult({
          status: 'pending',
          message: 'Registration record found. Status is currently pending administrator review.',
        });
      }
    } catch {
      setStatusResult({
        status: 'pending',
        message: 'Unable to connect to server. Please try checking again in a moment.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleContinueToDashboard = () => {
    if (statusResult?.userData) {
      setAuth(statusResult.userData);
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <GovHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-gradient-to-br from-[#0F2C59] via-[#0A1F3F] to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md p-8 text-center">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {statusResult?.status === 'approved' ? (
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-amber-400" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0F2C59] border-2 border-amber-400 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-extrabold text-white mb-2">
              {statusResult?.status === 'approved' ? 'Account Approved!' : 'Account Pending Approval'}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {statusResult?.status === 'approved'
                ? 'Your registration has been reviewed and verified by the PhilFIDA Administrator.'
                : 'Your account registration has been submitted successfully. A PhilFIDA Administrator will review and approve your account before you can access the system.'}
            </p>

            {/* Status Alert Banner */}
            {statusResult && (
              <div className={`p-4 rounded-xl mb-6 text-left border text-xs leading-relaxed ${
                statusResult.status === 'approved'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : statusResult.status === 'rejected'
                  ? 'bg-red-950/60 border-red-500/40 text-red-200'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  {statusResult.status === 'approved' ? (
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1">
                      {statusResult.status === 'approved' ? 'Approval Confirmed' : 'Registration Status'}
                    </p>
                    <p>{statusResult.message}</p>
                    
                    {statusResult.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/30 flex flex-col gap-2">
                        <p className="font-semibold text-emerald-300">
                          Do you want to continue inside the PhilFIDA Leave Credit Management System now?
                        </p>
                        <Button
                          variant="primary"
                          onClick={handleContinueToDashboard}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 py-2.5"
                        >
                          <span>Continue inside the System</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info Cards — shown when not approved yet */}
            {statusResult?.status !== 'approved' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs font-bold text-amber-400 mb-1">What happens next?</p>
                  <p className="text-xs text-slate-300">The Administrative Unit will verify your identity and activate your account access.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs font-bold text-amber-400 mb-1">How long does it take?</p>
                  <p className="text-xs text-slate-300">Usually within 1–2 business days. Click "Check Status" anytime to check for updates.</p>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
              <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>For urgent access, contact HR at <strong className="text-emerald-400">hr@philfida.da.gov.ph</strong></span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                isLoading={checking}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={handleCheckStatus}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-slate-400 hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
              PhilFIDA Regional Office VII — Leave Credit Management System
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
