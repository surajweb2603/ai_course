'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from './auth';

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  provider: string;
  createdAt?: string;
}

interface UseAuthGuardReturn {
  user: User | null;
  loading: boolean;
}

export function useAuthGuard(): UseAuthGuardReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const userData = await getMe();
        
        if (!userData) {
          router.push('/login');
          return;
        }
        
        setUser(userData);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  return { user, loading };
}

