import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
          <HeartPulse className="w-5 h-5 text-primary" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};
