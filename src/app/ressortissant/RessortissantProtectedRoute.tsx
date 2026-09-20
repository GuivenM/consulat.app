import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRessortissantAuth } from '../context/RessortissantAuthContext';

export function RessortissantProtectedRoute() {
  const { isAuthenticated, isLoading } = useRessortissantAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-brand-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/espace-consulaire/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
