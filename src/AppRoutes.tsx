import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { SupplierDashboard } from './pages/SupplierDashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';

// Index root dispatcher
const RootDispatcher: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.primaryRole === 'supplier') {
    return <Navigate to="/dashboard/supplier" replace />;
  }

  if (user.primaryRole === 'buyer') {
    return <Navigate to="/dashboard/buyer" replace />;
  }

  return <Navigate to="/select-role" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<RootDispatcher />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/select-role" element={<RoleSelectionPage />} />

          {/* Supplier / Farmer Dashboard */}
          <Route
            path="/dashboard/supplier"
            element={
              <ProtectedRoute allowedRole="supplier">
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />

          {/* Buyer / Procurement Dashboard */}
          <Route
            path="/dashboard/buyer"
            element={
              <ProtectedRoute allowedRole="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
