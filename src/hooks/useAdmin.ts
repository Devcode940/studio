"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAdmin(requireAdmin = true) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (requireAdmin && !isAdmin) {
        router.push('/dashboard'); // non-admin redirected
      }
    }
  }, [user, isAdmin, loading, requireAdmin, router]);

  return { user, isAdmin, loading, isAuthorized: requireAdmin ? isAdmin : !!user };
}

export function useIsAdmin() {
  const { isAdmin, loading, user } = useAuth();
  return { isAdmin, loading, user, isAdminReady: !loading };
}
