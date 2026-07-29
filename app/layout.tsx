import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'PhilFIDA Leave Credit Management System (PLCMS)',
  description:
    'Official Enterprise Leave Credit Management System for the Philippine Fiber Industry Development Authority (PhilFIDA), Department of Agriculture.',
  keywords: [
    'PhilFIDA',
    'Leave Credit Management System',
    'Philippine Fiber Industry Development Authority',
    'Department of Agriculture',
    'Civil Service Leave Credits',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
