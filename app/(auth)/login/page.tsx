'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { useAuthStore } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GovHeader } from '@/components/layout/gov-header';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, User, KeyRound, 
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PHILFIDA_DIVISIONS, PHILFIDA_OFFICES } from '@/lib/constants';
import { registrationWorkflowSchema } from '@/lib/validations/schemas';

type TabType = 'login' | 'register' | 'forgot' | 'verify';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registrationWorkflowSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

// Helper: Calculate Password Strength (0 to 4)
function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: 'None', color: 'bg-slate-700' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-400' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-400' };
}

// Helper: Dedicated API call for Registration
async function callRegisterApi(params: {
  email: string;
  displayName?: string;
  photoUrl?: string;
  position?: string;
  appointmentType?: string;
  office?: string;
  division?: string;
  authProvider: 'email' | 'google' | string;
  emailVerified?: boolean;
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { 
      code: data.error || 'REGISTRATION_ERROR', 
      message: data.message || 'Registration failed', 
      user: data.user 
    };
  }
  return data;
}

// Helper: Login API Call
async function callPlcmsLogin(params: {
  email: string;
  displayName?: string;
  photoUrl?: string;
  authProvider: 'email' | 'google';
}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { code: data.error, message: data.message || 'Authentication failed', user: data.user };
  }
  return data;
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [tab, setTab] = useState<TabType>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Email Verification Screen State
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forms
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registrationWorkflowSchema),
    defaultValues: {
      displayName: '',
      email: '',
      position: '',
      appointmentType: 'Permanent',
      office: PHILFIDA_OFFICES[0],
      division: PHILFIDA_DIVISIONS[0],
      password: '',
      confirmPassword: '',
    },
  });
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  // Watch password for live strength meter
  const watchedPassword = registerForm.watch('password') || '';
  const pwdStrength = getPasswordStrength(watchedPassword);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle generic error
  const handleAuthError = (err: any) => {
    if (err?.code === 'DUPLICATE_ACCOUNT') {
      toast.error(err.message || 'Account already exists. Switching to Sign In...');
      setTab('login');
      if (err?.email) loginForm.setValue('email', err.email);
      return;
    }
    if (err?.code === 'ACCOUNT_PENDING') {
      if (err.user) setAuth(err.user);
      router.push('/pending-approval');
      return;
    }
    const msg = err?.message || err?.code || 'Authentication failed';
    toast.error(msg);
  };

  // ─── EMAIL / PASSWORD SIGN IN ─────────────────────────────────────────────
  const onLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');

      let loginEmail = values.email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail.toLowerCase()}@philfida.da.gov.ph`;
      }

      let fbUser: any = null;

      try {
        const credential = await signInWithEmailAndPassword(auth, loginEmail, values.password);
        fbUser = credential.user;
      } catch (fbErr: any) {
        // If user credential missing in Firebase Auth, attempt automatic provision or server sync
        if (fbErr?.code === 'auth/user-not-found' || fbErr?.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, loginEmail, values.password);
            fbUser = newCred.user;
          } catch {
            throw fbErr;
          }
        } else {
          throw fbErr;
        }
      }

      const data = await callPlcmsLogin({
        email: fbUser?.email || loginEmail,
        displayName: fbUser?.displayName || undefined,
        photoUrl: fbUser?.photoURL || undefined,
        authProvider: 'email',
      });

      if (data.pending || data?.user?.accountStatus === 'Pending') {
        setAuth(data.user);
        toast.info('Your account is pending administrator approval.');
        router.push('/pending-approval');
        return;
      }

      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.employeeName || data.user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found') {
        toast.error('Invalid email/username or password. Please try again.');
      } else if (err?.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── GOOGLE SIGN-IN ────────────────────────────────────────────────────────
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

      if (data.pending || data?.user?.accountStatus === 'Pending') {
        setAuth(data.user);
        toast.info('Your account is pending administrator approval.');
        router.push('/pending-approval');
        return;
      }

      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.employeeName || data.user.username}!`);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code === 'popup-closed-by-user' || err?.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── NEW FRESH EMAIL REGISTRATION WORKFLOW ───────────────────────────────
  const onRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');

      // Step 1: Create user in Firebase Authentication
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.displayName });

      // Step 2: Dispatch Firebase Email Verification Link
      try {
        await sendEmailVerification(credential.user);
      } catch (e) {
        console.warn('Email verification send notice:', e);
      }

      // Step 3: Register in PLCMS Cloud Engine (Pending Admin Approval)
      const data = await callRegisterApi({
        email: values.email,
        displayName: values.displayName,
        position: values.position,
        appointmentType: values.appointmentType,
        office: values.office,
        division: values.division,
        authProvider: 'email',
        emailVerified: false,
      });

      setVerificationEmail(values.email);
      if (data?.user) setAuth(data.user);

      // Step 4: Display Email Verification Screen
      setTab('verify');
      setResendCooldown(60);
      toast.success('Verification link sent! Please check your email inbox.');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        toast.error('An account with this email address already exists. Switching to Sign In...');
        loginForm.setValue('email', values.email);
        setTab('login');
      } else if (err?.code === 'auth/weak-password') {
        toast.error('Password does not meet strength requirements.');
      } else {
        handleAuthError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RESEND EMAIL VERIFICATION ───────────────────────────────────────────
  const onResendVerification = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      if (auth?.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success('A new verification link has been sent to your email.');
        setResendCooldown(60);
      } else {
        toast.error('Session expired. Please sign in to request verification.');
        setTab('login');
      }
    } catch {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── CHECK EMAIL VERIFIED & PROCEED TO PENDING APPROVAL ─────────────────
  const onConfirmEmailVerified = async () => {
    setIsLoading(true);
    try {
      if (auth?.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          // Sync with server
          await fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: auth.currentUser.email }),
          });

          toast.success('Email address verified successfully!');
          router.push('/pending-approval');
          return;
        } else {
          toast.error('Email not verified yet! Please click the link sent to your inbox.');
        }
      } else {
        router.push('/pending-approval');
      }
    } catch {
      toast.error('Could not verify status. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
  const onForgotPassword = async (values: ForgotValues) => {
    setIsLoading(true);
    try {
      if (!auth) throw new Error('Firebase not initialized');
      await sendPasswordResetEmail(auth, values.email);
      toast.success('Password reset link sent! Please check your email inbox.');
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
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md p-6 sm:p-8">

            {/* Header Branding */}
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

            {/* Tab Switcher (Visible on Login / Register) */}
            {(tab === 'login' || tab === 'register') && (
              <div className="flex rounded-xl bg-slate-800/80 p-1 mb-6 border border-slate-700/50">
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
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
            )}

            {/* ─── SIGN IN FORM ─── */}
            {tab === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <Input
                  label="Email or Username"
                  placeholder="e.g. admin or juan.delacruz@philfida.da.gov.ph"
                  type="text"
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
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
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

                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors disabled:opacity-60 shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </button>
              </form>
            )}

            {/* ─── FRESH REDESIGNED REGISTER FORM ─── */}
            {tab === 'register' && (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                  <span>All registrations require email verification &amp; Administrator approval.</span>
                </div>

                <Input
                  label="Full Name"
                  placeholder="e.g. Juan Carlos Dela Cruz"
                  error={registerForm.formState.errors.displayName?.message}
                  {...registerForm.register('displayName')}
                  className="bg-slate-950 border-slate-700 text-white text-xs"
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. juan.delacruz@philfida.da.gov.ph"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email')}
                  className="bg-slate-950 border-slate-700 text-white text-xs"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employment Type <span className="text-amber-400">*</span>
                  </label>
                  <select
                    {...registerForm.register('appointmentType')}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="COS / JO">COS / JO (Contract of Service / Job Order)</option>
                  </select>
                  {registerForm.formState.errors.appointmentType && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {registerForm.formState.errors.appointmentType.message}
                    </p>
                  )}
                </div>

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

                {/* Password Input with Live Strength Gauge */}
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars (A-Z, a-z, 0-9)"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register('password')}
                    className="bg-slate-950 border-slate-700 text-white pr-10 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Password Strength Indicator Bar */}
                  {watchedPassword && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Password Strength:</span>
                        <span className={cn('font-bold', pwdStrength.score === 4 ? 'text-emerald-400' : pwdStrength.score >= 2 ? 'text-amber-400' : 'text-red-400')}>
                          {pwdStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        <div className={cn('h-full flex-1 transition-all duration-300', pwdStrength.score >= 1 ? pwdStrength.color : 'bg-slate-800')} />
                        <div className={cn('h-full flex-1 transition-all duration-300', pwdStrength.score >= 2 ? pwdStrength.color : 'bg-slate-800')} />
                        <div className={cn('h-full flex-1 transition-all duration-300', pwdStrength.score >= 4 ? pwdStrength.color : 'bg-slate-800')} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register('confirmPassword')}
                    className="bg-slate-950 border-slate-700 text-white pr-10 text-xs"
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
                  className="w-full font-bold py-2.5 shadow-md"
                  isLoading={isLoading}
                >
                  <User className="w-4 h-4 mr-2" />
                  Create Account
                </Button>

                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors disabled:opacity-60 shadow-md"
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

            {/* ─── EMAIL VERIFICATION SCREEN ─── */}
            {tab === 'verify' && (
              <div className="space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                  <Mail className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    A verification link has been sent to: <br />
                    <strong className="text-amber-400 font-mono text-sm">{verificationEmail || 'your email inbox'}</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next Steps:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                    <li>Open your email inbox and click the verification link.</li>
                    <li>Return here and click <strong>&quot;I Have Verified My Email&quot;</strong> below.</li>
                    <li>Your account will be submitted for Super Admin review.</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="button"
                    variant="accent"
                    className="w-full font-bold py-2.5 shadow-md"
                    onClick={onConfirmEmailVerified}
                    isLoading={isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    I Have Verified My Email
                  </Button>

                  <button
                    type="button"
                    onClick={onResendVerification}
                    disabled={resendCooldown > 0 || isLoading}
                    className="w-full py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                    {resendCooldown > 0 ? `Resend Verification Email (${resendCooldown}s)` : 'Resend Verification Email'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="w-full text-xs text-slate-400 hover:text-white transition-colors py-1 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ─── FORGOT PASSWORD FORM ─── */}
            {tab === 'forgot' && (
              <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs text-slate-300">
                    Enter your registered email address and we&apos;ll send you a password reset link.
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
                  className="w-full font-bold py-2.5 shadow-md"
                  isLoading={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="w-full text-xs text-slate-400 hover:text-white transition-colors py-2 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
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
