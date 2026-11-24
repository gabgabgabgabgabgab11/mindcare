import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  allowedRoles: Array<'student' | 'admin'>;
  requireNoActiveConsent?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requireNoActiveConsent = false }) => {
  const { isAuthenticated, isLoading, role, hasActiveConsent, isMfaVerified } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" replace />;
  }

  if (!isMfaVerified) return <Navigate to="/login" replace />;

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
