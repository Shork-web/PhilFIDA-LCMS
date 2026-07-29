'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { useAuthStore } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GovHeader } from '@/components/layout/gov-header';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, User, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PHILFIDA_DIVISIONS, PHILFIDA_OFFICES } from '@/lib/constants';

type TabType = 'login' | 'register' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  displayName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  position: z.string().min(2, 'Position title is required'),
  office: z.string().min(1, 'Please select your PhilFIDA Office Station'),
  division: z.string().min(1, 'Please select your division / unit'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

// ─── Helper: call PLCMS API after Firebase auth succeeds ───────────────────
async function callPlcmsLogin(params: {
  email: string;
  displayName?: string;
  photoUrl?: string;
  position?: string;
  office?: string;
  division?: string;
  authProvider: 'email' | 'google';
}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw { code: data.error, message: data.message || 'Authentication failed', user: data.user };
  return data;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<TabType>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login form
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      position: '',
      office: PHILFIDA_OFFICES[0],
      division: PHILFIDA_DIVISIONS[0],
    },
  });

  // Forgot password form
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  // ─── Handle account status codes ─────────────────────────────────────────
  const handleAuthError = (err: any) => {
    if (err?.code === 'ACCOUNT_PENDING') {
      if (err.user) {
        setAuth(err.user);
      }
      router.push('/pending-approval');
      return;
    }
    const msg = err?.message || err?.code || 'Authentication failed';
    toast.error(msg);
  };

  // ─── Email/Password Login ─────────────────────────────────────────────────
  const onLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const fbUser = credential.user;

      const data = await callPlcmsLogin({
        email: fbUser.email!,
        displayName: fbUser.displayName || undefined,
        photoUrl: fbUser.photoURL || undefined,
        authProvider: 'email',
      });

      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.employeeName || data.user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found') {
        toast.error('Invalid email or password. Please try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later or reset your password.');
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google Sign-In ───────────────────────────────────────────────────────
  const onGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const data = await callPlcmsLogin({
        email: fbUser.email!,
        displayName: fbUser.displayName || undefined,
        photoUrl: fbUser.photoURL || undefined,
        authProvider: 'google',
      });

      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.employeeName || data.user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // User cancelled — no error toast needed
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Email Registration ───────────────────────────────────────────────────
  const onRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.displayName });

      const data = await callPlcmsLogin({
        email: values.email,
        displayName: values.displayName,
        position: values.position,
        office: values.office,
        division: values.division,
        authProvider: 'email',
      });

      // If pending, redirect to pending page
      if (data?.user?.accountStatus === 'Pending') {
        toast.success('Registration submitted! Please wait for administrator approval.');
        router.push('/pending-approval');
        return;
      }

      // If first user (Super Admin), go to dashboard
      setAuth(data.user, data.token);
      toast.success('Account created! Welcome to PhilFIDA LCMS.');
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists. Please sign in instead.');
      } else if (err?.code === 'auth/weak-password') {
        toast.error('Password is too weak. Use at least 8 characters with numbers and letters.');
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Forgot Password ──────────────────────────────────────────────────────
  const onForgotPassword = async (values: ForgotValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');
      await sendPasswordResetEmail(auth, values.email);
      toast.success('Password reset email sent! Check your inbox.');
      setTab('login');
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        toast.error('No account found with this email address.');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <GovHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#0F2C59] via-[#0A1F3F] to-slate-950">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md p-6 sm:p-8">

            {/* Branding */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#0F2C59] border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg">
                PF
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  PhilFIDA LCMS Portal
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Philippine Fiber Industry Development Authority — Regional Office VII
                </p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-slate-800 p-1 mb-6">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                    tab === t
                      ? 'bg-amber-400 text-[#0F2C59] shadow-md'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {t === 'login' ? 'Sign In' : 'Employee Sign Up'}
                </button>
              ))}
            </div>

            {/* ─── LOGIN FORM ─── */}
            {tab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <Input
                  label="Email Address"
                  placeholder="e.g. juan.delacruz@philfida.da.gov.ph"
                  type="email"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email')}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                    className="bg-slate-950 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full font-bold py-2.5 shadow-md"
                  isLoading={isLoading}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </Button>

                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">or continue with</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors disabled:opacity-60 shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
            )}

            {/* ─── REGISTER FORM ─── */}
            {tab === 'register' && (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>All new sign-ups are created as <strong>Employee</strong> accounts pending Administrator review.</span>
                </div>

                <Input
                  label="Full Name"
                  placeholder="e.g. Juan Carlos Dela Cruz"
                  error={registerForm.formState.errors.displayName?.message}
                  {...registerForm.register('displayName')}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. juan.delacruz@philfida.da.gov.ph"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Input
                  label="Position Title"
                  placeholder="e.g. Fibre Development Officer II"
                  error={registerForm.formState.errors.position?.message}
                  {...registerForm.register('position')}
                  className="bg-slate-950 border-slate-700 text-white text-xs"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PhilFIDA Office Station
                  </label>
                  <select
                    {...registerForm.register('office')}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select Office Station...</option>
                    {PHILFIDA_OFFICES.map((off) => (
                      <option key={off} value={off}>
                        {off}
                      </option>
                    ))}
                  </select>
                  {registerForm.formState.errors.office && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {registerForm.formState.errors.office.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Division / Unit
                  </label>
                  <select
                    {...registerForm.register('division')}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Select Division / Unit...</option>
                    <optgroup label="── Support Division ──">
                      <option value="AFMD - Admin Finance and Management Division">AFMD - Admin Finance and Management Division</option>
                      <option value="Planning Division">Planning Division</option>
                      <option value="MIS - Management Information System">MIS - Management Information System</option>
                    </optgroup>
                    <optgroup label="── Operations Division ──">
                      <option value="FUTD - Fiber Utilization and Technology Division">FUTD - Fiber Utilization and Technology Division</option>
                      <option value="Research Division">Research Division</option>
                      <option value="Regulatory Division">Regulatory Division</option>
                      <option value="TAD - Technical Assistance Division">TAD - Technical Assistance Division</option>
                    </optgroup>
                  </select>
                  {registerForm.formState.errors.division && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {registerForm.formState.errors.division.message}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                    className="bg-slate-950 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                    className="bg-slate-950 border-slate-700 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full font-bold py-2.5"
                  isLoading={isLoading}
                >
                  <User className="w-4 h-4 mr-2" />
                  Create Account
                </Button>

                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors disabled:opacity-60 shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Register with Google
                </button>
              </form>
            )}

            {/* ─── FORGOT PASSWORD ─── */}
            {tab === 'forgot' && (
              <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-slate-300">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. juan.delacruz@philfida.da.gov.ph"
                  error={forgotForm.formState.errors.email?.message}
                  {...forgotForm.register('email')}
                  className="bg-slate-950 border-slate-700 text-white"
                />

                <Button
                  type="submit"
                  variant="accent"
                  className="w-full font-bold py-2.5"
                  isLoading={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="w-full text-xs text-slate-400 hover:text-white transition-colors py-2"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* Security Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Protected Government System &bull; Unauthorized Access Prohibited</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
