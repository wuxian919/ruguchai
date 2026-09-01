'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: number;
  username: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  getToken: () => string | null;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        router.push('/login');
        return;
      }

      const data = await res.json();
      setUser(data.user);
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const getToken = () => localStorage.getItem('auth_token');

  return { user, loading, logout, getToken };
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}
