
"use client";

import type { User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>; // Simplified
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for checking existing session (e.g., from localStorage or a cookie)
    // For now, assume no user is logged in on initial load for simplicity
    const checkLoggedIn = async () => {
      try {
        // const storedUser = localStorage.getItem('kenyaWatchUser');
        // if (storedUser) {
        //   setUser(JSON.parse(storedUser));
        // }
      } catch (error) {
        console.error("Failed to load user from storage", error);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const login = async (email: string, _pass: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = { id: '123', email, name: email.split('@')[0] };
    setUser(mockUser);
    // localStorage.setItem('kenyaWatchUser', JSON.stringify(mockUser));
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    // localStorage.removeItem('kenyaWatchUser');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
