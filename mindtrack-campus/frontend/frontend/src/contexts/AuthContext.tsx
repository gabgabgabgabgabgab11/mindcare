import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import { api } from '../config/axios';
import type { MeResponse, Role } from '../types';
import { adminCache } from '../services/adminCache';
import { studentCache } from '../services/studentCache';
import { AuthContext } from './AuthContextValue';
import { isSessionInactive, recordSessionActivity, markInactivitySignOut, sessionActivityKey } from '../utils/sessionInactivity';
import { createAccountLoader, retryAccountRequest } from '../utils/accountLoader';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasActiveConsent, setHasActiveConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const generation = useRef(0);
  const currentKey = useRef<string | null>(null);
  const loader = useRef(createAccountLoader(async () => {
    const { data } = await retryAccountRequest(() => api.get<MeResponse>('/api/v1/auth/me', { timeout: 15_000 }));
    let consent: boolean | null = null;
    if (data.role === 'student') {
      const response = await retryAccountRequest(() => api.get<{ has_active_consent: boolean }>('/api/v1/consent/status', { timeout: 15_000 }));
      consent = response.data.has_active_consent;
    }
    return { role: data.role, consent };
  }));

  const clearAccount = useCallback(() => {
    generation.current++;
    currentKey.current = null;
    loader.current.clear();
    adminCache.clear();
    studentCache.clear();
    setSession(null);
    setRole(null);
    setHasActiveConsent(null);
    setAuthError(null);
    setIsLoading(false);
  }, []);

  const loadAccount = useCallback(async (nextSession: Session, force = false) => {
    const key = sessionActivityKey(nextSession);
    if (currentKey.current !== key) {
      generation.current++;
      currentKey.current = key;
      adminCache.clear();
      studentCache.clear();
      setRole(null);
      setHasActiveConsent(null);
    }
    const version = generation.current;
    if (loader.current.isLoaded(key) && !force) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      const account = await loader.current.load(key, force);
      if (generation.current !== version) return;
      setRole(account.role);
      setHasActiveConsent(account.consent);
    } catch {
      if (generation.current !== version) return;
      setRole(null);
      setHasActiveConsent(null);
      setAuthError('You are signed in, but your account could not be loaded. Please try again.');
    } finally {
      if (generation.current === version) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const generationRef = generation;
    const accountLoader = loader.current;
    const timers = new Set<number>();
    const acceptSession = async (nextSession: Session | null, restored = false) => {
      if (!active) return;
      if (!nextSession) { clearAccount(); return; }
      if (isSessionInactive(nextSession)) {
        clearAccount();
        markInactivitySignOut();
        await supabase.auth.signOut({ scope: 'local' });
        return;
      }
      if (restored) recordSessionActivity(nextSession);
      setSession(nextSession);
      await loadAccount(nextSession);
    };
    // Keep this callback synchronous: calling Supabase (even indirectly via
    // the axios token interceptor) while notifying listeners can deadlock Auth.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        void acceptSession(nextSession);
      }, 0);
      timers.add(timer);
    });
    void supabase.auth.getSession().then(({ data }) => acceptSession(data.session, true)).catch(() => {
      if (!active) return;
      setAuthError('Your session could not be restored. Please sign in again.');
      setIsLoading(false);
    });
    return () => {
      active = false;
      generationRef.current++;
      currentKey.current = null;
      accountLoader.clear();
      for (const timer of timers) window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, [clearAccount, loadAccount]);

  useEffect(() => {
    if (!session || !authError) return;
    const recover = () => {
      if (document.visibilityState !== 'hidden' && navigator.onLine) void loadAccount(session);
    };
    window.addEventListener('online', recover);
    window.addEventListener('focus', recover);
    document.addEventListener('visibilitychange', recover);
    return () => {
      window.removeEventListener('online', recover);
      window.removeEventListener('focus', recover);
      document.removeEventListener('visibilitychange', recover);
    };
  }, [session, authError, loadAccount]);

  useEffect(() => {
    if (!session) return;
    let expiring = false;
    const expire = () => {
      if (expiring) return;
      expiring = true;
      clearAccount();
      markInactivitySignOut();
      void supabase.auth.signOut({ scope: 'local' });
    };
    const check = () => { if (isSessionInactive(session)) expire(); };
    const activity = () => { if (!recordSessionActivity(session)) expire(); };
    const visible = () => { if (document.visibilityState === 'visible') activity(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    for (const event of events) window.addEventListener(event, activity, { passive: true });
    window.addEventListener('focus', activity);
    window.addEventListener('storage', check);
    document.addEventListener('visibilitychange', visible);
    const timer = window.setInterval(check, 60_000);
    check();
    return () => {
      window.clearInterval(timer);
      for (const event of events) window.removeEventListener(event, activity);
      window.removeEventListener('focus', activity);
      window.removeEventListener('storage', check);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [session, clearAccount]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const retryAccountLoad = async () => {
    if (session) await loadAccount(session, true);
  };
  const logout = async () => {
    clearAccount();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!session, isLoading, role,
      hasActiveConsent, session, authError, login, retryAccountLoad, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
