import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { reportApi } from '@/services/reportApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardStatsProps {
  onNavigateToReports: () => void;
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ onNavigateToReports }) => {
  const today = getTodayString();

  const { data: mtdReport, isLoading } = useQuery({
    queryKey: ['report', 'month-to-date', today],
    queryFn: () => reportApi.getMonthToDateReport(today),
  });

  return (
    <Card className="border-border bg-gradient-to-r from-card via-card to-secondary/15 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Summary Title & Metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Month-to-Date Glucose Overview
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Summary metrics from {mtdReport?.startDate || 'the 1st'} through today ({today})
                </p>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-1">
              {/* Average */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Average:</span>
                {isLoading ? (
                  <span className="h-4 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-sm text-foreground">
                    {mtdReport?.average !== null && mtdReport?.average !== undefined
                      ? `${mtdReport.average} mg/dl`
                      : '—'}
                  </span>
                )}
              </div>

              {/* Highest */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-lavender-500" />
                <span className="text-xs text-muted-foreground">Peak:</span>
                {isLoading ? (
                  <span className="h-4 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-sm text-foreground">
                    {mtdReport?.highest !== null && mtdReport?.highest !== undefined
                      ? `${mtdReport.highest} mg/dl`
                      : '—'}
                  </span>
                )}
              </div>

              {/* Lowest */}
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-mint-500" />
                <span className="text-xs text-muted-foreground">Lowest:</span>
                {isLoading ? (
                  <span className="h-4 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-bold text-sm text-foreground">
                    {mtdReport?.lowest !== null && mtdReport?.lowest !== undefined
                      ? `${mtdReport.lowest} mg/dl`
                      : '—'}
                  </span>
                )}
              </div>

              {/* Total logged */}
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Recorded:</span>
                {isLoading ? (
                  <span className="h-4 w-8 bg-muted rounded animate-pulse" />
                ) : (
                  <span className="font-mono font-semibold text-xs text-foreground">
                    {mtdReport?.count || 0} readings
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick CTA to Reports */}
          <div className="self-end sm:self-center flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToReports}
              className="text-xs gap-1.5 font-medium shadow-sm hover:border-primary/40 hover:bg-primary/5"
            >
              View Full Analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
