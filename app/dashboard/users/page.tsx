'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/account-management');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-500 font-medium text-sm">
      Redirecting to Account Management...
    </div>
  );
}
