import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  allowedRoles: Array<'student' | 'admin'>;
  requireNoActiveConsent?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requireNoActiveConsent = false }) => {
  const { isAuthenticated, isLoading, role, hasActiveConsent, authError } = useAuth();

  if (isLoading) {
    return <div role="status" className="flex min-h-screen items-center justify-center text-sm text-slate-600 dark:text-slate-300">Loading your account…</div>;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" replace />;
  }

  if (!role || authError) return <Navigate to="/login" replace />;

  if (role && !allowedRoles.includes(role)) {
    // Redirect unauthorized users (e.g., student trying to access admin page)
    return <Navigate to="/dashboard" replace />;
  }

  if (requireNoActiveConsent && hasActiveConsent !== false) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authorized, render the child routes
  return <Outlet />;
};
