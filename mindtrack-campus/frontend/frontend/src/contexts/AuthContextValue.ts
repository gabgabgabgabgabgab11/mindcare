import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Role } from '../types';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  hasActiveConsent: boolean | null;
  session: Session | null;
  isMfaVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  beginMfa: () => Promise<{ factorId: string; qrCode?: string; secret?: string; isEnrollment: boolean }>;
  verifyMfa: (factorId: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
