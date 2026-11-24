import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseClient';
import { api } from '../config/axios';
import type { MeResponse, Role } from '../types';
import { adminCache } from '../services/adminCache';
import { AuthContext } from './AuthContextValue';
import { isSessionInactive, recordSessionActivity, markInactivitySignOut } from '../utils/sessionInactivity';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasActiveConsent, setHasActiveConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMfaVerified, setIsMfaVerified] = useState(false);

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
      if (data.session && isSessionInactive(data.session)) {
        markInactivitySignOut();
        await supabase.auth.signOut({ scope: 'local' });
        setIsLoading(false);
        return;
      }
      if (data.session) recordSessionActivity(data.session);
      setSession(data.session);
      if (data.session) {
        currentUserIdRef.current = data.session.user.id;
        const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        setIsMfaVerified(assurance?.currentLevel === 'aal2');
        if (assurance?.currentLevel === 'aal2') await syncUserData();
      }
      setIsLoading(false);
    });

    // Keep session in sync with Supabase's auth events without unmounting pages on tab focus/token refresh
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession && isSessionInactive(newSession)) {
        setSession(null);
        setIsMfaVerified(false);
        setRole(null);
        setHasActiveConsent(null);
        adminCache.clear();
        markInactivitySignOut();
        // Do not await another Auth operation inside the auth event callback.
        window.setTimeout(() => { void supabase.auth.signOut({ scope: 'local' }); }, 0);
        return;
      }
      setSession(newSession);
      const newUserId = newSession?.user?.id ?? null;
      if (newSession) {
        if (event === 'MFA_CHALLENGE_VERIFIED') {
          setIsMfaVerified(true);
          currentUserIdRef.current = newUserId;
          await syncUserData();
        } else {
          // Supabase can emit SIGNED_IN when a tab regains focus. Derive the
          // MFA state from the session instead of assuming each event is a new
          // password-only sign-in, or a verified user gets sent back to setup.
          const shouldSyncUser = event === 'SIGNED_IN' || newUserId !== currentUserIdRef.current;
          currentUserIdRef.current = newUserId;
          const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const hasVerifiedMfa = assurance?.currentLevel === 'aal2';
          setIsMfaVerified(hasVerifiedMfa);
          if (shouldSyncUser && hasVerifiedMfa) await syncUserData();
        }
      } else {
        setIsMfaVerified(false);
        currentUserIdRef.current = null;
        setRole(null);
        setHasActiveConsent(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let expiring = false;
    const expire = () => {
      if (expiring) return;
      expiring = true;
      adminCache.clear();
      setSession(null);
      setRole(null);
      setHasActiveConsent(null);
      setIsMfaVerified(false);
      markInactivitySignOut();
      void supabase.auth.signOut({ scope: 'local' });
    };
    const check = () => { if (isSessionInactive(session)) expire(); };
    const activity = () => { if (!recordSessionActivity(session)) expire(); };
    const visible = () => { if (document.visibilityState === 'visible') activity(); };
    // Browser events count; API polling and automatic token refreshes do not.
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
  }, [session]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange above will pick up the new session and fetch the role.
  };

  const beginMfa = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const verified = data.totp[0];
    if (verified) return { factorId: verified.id, isEnrollment: false };

    for (const factor of data.all.filter((item) => item.factor_type === 'totp' && item.status === 'unverified')) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data: enrollment, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'MindCare Campus',
      friendlyName: 'MindCare Campus authenticator',
    });
    if (enrollError) throw enrollError;
    return {
      factorId: enrollment.id,
      qrCode: enrollment.totp.qr_code,
      secret: enrollment.totp.secret,
      isEnrollment: true,
    };
  }, []);

  const verifyMfa = useCallback(async (factorId: string, code: string) => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) throw error;
    setIsMfaVerified(true);
  }, []);

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
        isMfaVerified,
        login,
        beginMfa,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

