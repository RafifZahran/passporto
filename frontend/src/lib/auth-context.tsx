'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string | null) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('passporto_token');
    const storedUser = localStorage.getItem('passporto_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      setUser(res.data);
      localStorage.setItem('passporto_user', JSON.stringify(res.data));
    } catch {
      // Token expired — clear auth state
      logout();
    }
  }, []);

  const login = async (email: string, password: string, redirectTo: string | null = '/dashboard') => {
    const res = await authApi.login(email, password);
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('passporto_token', t);
    localStorage.setItem('passporto_user', JSON.stringify(u));
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  const register = async (email: string, password: string) => {
    const res = await authApi.register(email, password);
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('passporto_token', t);
    localStorage.setItem('passporto_user', JSON.stringify(u));
    router.push('/dashboard');
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('passporto_token');
    localStorage.removeItem('passporto_user');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
