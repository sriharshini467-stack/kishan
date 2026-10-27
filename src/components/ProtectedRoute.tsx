import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PrimaryRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: PrimaryRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-600 font-semibold text-sm">Authenticating KisanSetu session...</p>
      </div>
    );
  }

  // If not logged in, redirect to /auth
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role is unassigned, redirect to /select-role
  if (user.primaryRole === 'unassigned') {
    return <Navigate to="/select-role" replace />;
  }

  // If route is restricted to a specific role, verify
  if (allowedRole && user.primaryRole !== allowedRole) {
    // If supplier trying to view buyer or vice-versa, redirect to their assigned dashboard
    if (user.primaryRole === 'supplier') {
      return <Navigate to="/dashboard/supplier" replace />;
    } else if (user.primaryRole === 'buyer') {
      return <Navigate to="/dashboard/buyer" replace />;
    }
  }

  return <>{children}</>;
};
