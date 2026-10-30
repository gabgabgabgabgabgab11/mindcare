import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Role } from '../types';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  hasActiveConsent: boolean | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);