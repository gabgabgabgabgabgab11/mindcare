import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import { api } from '../config/axios';
import type { MeResponse, Role } from '../types';
import { adminCache } from '../services/adminCache';
import { AuthContext } from './AuthContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasActiveConsent, setHasActiveConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const fetchRole = async (): Promise<Role | null> => {
      try {
        const { data } = await api.get<MeResponse>('/api/v1/auth/me');
        setRole(data.role);
        return data.role;
      } catch {
        setRole(null);
        return null;
      }
    };

    const fetchConsentStatus = async () => {
      try {
        const { data } = await api.get<{ has_active_consent: boolean }>('/api/v1/consent/status');
        setHasActiveConsent(data.has_active_consent);
      } catch {
        setHasActiveConsent(null);
      }
    };

    const syncUserData = async () => {
      const userRole = await fetchRole();
      // Consent is strictly a student concept on the backend (requires require_student dependency)
      if (userRole === 'student') {
        await fetchConsentStatus();
      } else {
        setHasActiveConsent(null);
      }
    };

    // Bootstrap: check for an existing session on app load (page refresh).
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        currentUserIdRef.current = data.session.user.id;
        await syncUserData();
      }
      setIsLoading(false);
    });

    // Keep session in sync with Supabase's auth events without unmounting pages on tab focus/token refresh
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const newUserId = newSession?.user?.id ?? null;
      if (newSession) {
        // Only run network sync if this is a new sign-in or user changed, not on plain focus/token refreshes
        if (event === 'SIGNED_IN' || newUserId !== currentUserIdRef.current) {
          currentUserIdRef.current = newUserId;
          await syncUserData();
        }
      } else {
        currentUserIdRef.current = null;
        setRole(null);
        setHasActiveConsent(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange above will pick up the new session and fetch the role.
  };

  const logout = async () => {
    adminCache.clear();
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        isLoading,
        role,
        hasActiveConsent,
        session,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

