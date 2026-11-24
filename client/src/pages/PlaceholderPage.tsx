import React, { useState } from 'react';
import {
  HeartPulse,
  LogOut,
  User as UserIcon,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { ReadingsManagement } from '@/features/readings/ReadingsManagement';
import { ReportsView } from '@/features/reports/ReportsView';

export type MainNavView = 'overview' | 'reports';

export const PlaceholderPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<MainNavView>('overview');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">Sweety</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">
                Blood Glucose Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Views Switcher */}
          <nav className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'overview'
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Readings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'reports'
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span>Reports</span>
            </button>
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs">
                <UserIcon className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-muted-foreground text-[11px]">({user.email})</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="text-xs gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Patient Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeView === 'overview' ? (
          <div className="space-y-8">
            {/* Patient Greeting */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Hello, {user?.name || 'Patient'}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl leading-relaxed">
                Log and monitor your daily fasting and post-meal glucose measurements to maintain healthy metabolic balance.
              </p>
            </div>

            {/* Compact Glucose Statistics Summary & Reports Entry Point */}
            <DashboardStats onNavigateToReports={() => setActiveView('reports')} />

            {/* Complete Blood Glucose Reading Management (CRUD & History) */}
            <ReadingsManagement />
          </div>
        ) : (
          <div className="space-y-6">
            <ReportsView />
          </div>
        )}
      </main>
    </div>
  );
};
