import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse shadow-sm">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1 text-center">
            <span className="text-sm font-medium text-foreground tracking-tight block">Sweety</span>
            <span className="text-xs text-muted-foreground block">Verifying secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
