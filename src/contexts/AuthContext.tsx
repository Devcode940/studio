"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { useFirebaseApp } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { logger } from '@/lib/logger';

// Real user type, compatible with previous MockUser but using FirebaseUser
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);

  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const tokenResult = await fbUser.getIdTokenResult();
          const adminClaim = !!tokenResult.claims.admin || tokenResult.claims.role === 'admin';
          setIsAdmin(adminClaim);

          const appUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            isAdmin: adminClaim,
          };
          setUser(appUser);
          logger.info('User authenticated', { uid: fbUser.uid, isAdmin: adminClaim });
        } catch (err) {
          logger.error('Failed to get ID token result', err, { uid: fbUser.uid });
          // Fallback to basic user
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            isAdmin: false,
          });
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      logger.info('User logged in via email', { email });
    } catch (err) {
      logger.error('Login failed', err, { email });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      logger.info('User registered', { email, uid: cred.user.uid });
    } catch (err) {
      logger.error('Registration failed', err, { email });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      logger.info('User logged in via Google', { uid: result.user.uid, email: result.user.email });
    } catch (err) {
      logger.error('Google login failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      logger.info('User logged out');
    } catch (err) {
      logger.error('Logout failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAdmin, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
