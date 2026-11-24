import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { reportApi } from '@/services/reportApi';
import { ReportSummaryCards } from './ReportSummaryCards';
import { DailyReadingsTable } from './DailyReadingsTable';
import { GlucoseTrendChart } from './GlucoseTrendChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ReportTypeTab = 'DAILY' | 'MONTH_TO_DATE' | 'PREVIOUS_MONTH';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ReportsView: React.FC = () => {
  const today = getTodayString();
  const [activeTab, setActiveTab] = useState<ReportTypeTab>('DAILY');
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // 1. Daily Report Query
  const {
    data: dailyReport,
    isLoading: isDailyLoading,
    isError: isDailyError,
    error: dailyError,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['report', 'daily', selectedDate],
    queryFn: () => reportApi.getDailyReport(selectedDate),
    enabled: activeTab === 'DAILY',
  });

  // 2. Month-to-Date Report Query
  const {
    data: mtdReport,
    isLoading: isMtdLoading,
    isError: isMtdError,
    error: mtdError,
    refetch: refetchMtd,
  } = useQuery({
    queryKey: ['report', 'month-to-date', selectedDate],
    queryFn: () => reportApi.getMonthToDateReport(selectedDate),
    enabled: activeTab === 'MONTH_TO_DATE',
  });

  // 3. Previous-Month Report Query
  const {
    data: prevMonthReport,
    isLoading: isPrevLoading,
    isError: isPrevError,
    error: prevError,
    refetch: refetchPrev,
  } = useQuery({
    queryKey: ['report', 'monthly', selectedDate],
    queryFn: () => reportApi.getPreviousMonthReport(selectedDate),
    enabled: activeTab === 'PREVIOUS_MONTH',
  });

  // Date step helper (for Daily view)
  const stepDate = (days: number) => {
    const current = new Date(`${selectedDate}T00:00:00Z`);
    current.setUTCDate(current.getUTCDate() + days);
    const newDateStr = current.toISOString().split('T')[0]!;
    if (newDateStr <= today) {
      setSelectedDate(newDateStr);
    }
  };

  const currentLoading =
    activeTab === 'DAILY'
      ? isDailyLoading
      : activeTab === 'MONTH_TO_DATE'
      ? isMtdLoading
      : isPrevLoading;

  const currentError =
    activeTab === 'DAILY'
      ? isDailyError
      : activeTab === 'MONTH_TO_DATE'
      ? isMtdError
      : isPrevError;

  const errorMessage =
    activeTab === 'DAILY'
      ? dailyError?.message
      : activeTab === 'MONTH_TO_DATE'
      ? mtdError?.message
      : prevError?.message;

  const handleRetry = () => {
    if (activeTab === 'DAILY') refetchDaily();
    if (activeTab === 'MONTH_TO_DATE') refetchMtd();
    if (activeTab === 'PREVIOUS_MONTH') refetchPrev();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Report Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Glucose Analytics & Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accurate statistical summaries, daily readings, and month-level trend visualizations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 self-start md:self-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('DAILY')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'DAILY'
                ? 'bg-card text-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MONTH_TO_DATE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'MONTH_TO_DATE'
                ? 'bg-card text-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Month to Date
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIOUS_MONTH')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'PREVIOUS_MONTH'
                ? 'bg-card text-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Previous Month
          </button>
        </div>
      </div>

      {/* Date Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-sm gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">Select Date Reference:</span>
          <div className="relative">
            <Input
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val <= today) {
                  setSelectedDate(val);
                }
              }}
              className="h-8 text-xs py-1 px-2.5 max-w-[150px] font-mono"
            />
          </div>
          {selectedDate !== today && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(today)}
              className="h-8 px-2 text-xs text-primary"
            >
              Today
            </Button>
          )}
        </div>

        {/* Date Boundaries Description */}
        <div className="flex items-center gap-2">
          {activeTab === 'DAILY' && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => stepDate(-1)}
                className="h-7 w-7 p-0"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-medium text-foreground px-1">
                {selectedDate}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => stepDate(1)}
                disabled={selectedDate >= today}
                className="h-7 w-7 p-0"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {activeTab === 'MONTH_TO_DATE' && mtdReport && (
            <span className="text-xs text-muted-foreground">
              Period: <strong className="text-foreground">{mtdReport.startDate}</strong> through{' '}
              <strong className="text-foreground">{mtdReport.endDate}</strong> (inclusive)
            </span>
          )}

          {activeTab === 'PREVIOUS_MONTH' && prevMonthReport && (
            <span className="text-xs text-muted-foreground">
              Period: <strong className="text-foreground">{prevMonthReport.startDate}</strong> through{' '}
              <strong className="text-foreground">{prevMonthReport.endDate}</strong> (full month)
            </span>
          )}
        </div>
      </div>

      {/* Error State Banner */}
      {currentError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage || 'Failed to load report data. Please verify your connection.'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="h-7 px-2.5 text-xs gap-1 border-destructive/30 hover:bg-destructive/20 text-destructive"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Report Content Panels */}
      {activeTab === 'DAILY' && (
        <div className="space-y-6">
          <ReportSummaryCards
            highest={dailyReport?.highest ?? null}
            lowest={dailyReport?.lowest ?? null}
            average={dailyReport?.average ?? null}
            count={dailyReport?.count ?? 0}
            isLoading={currentLoading}
          />
          <DailyReadingsTable
            readings={dailyReport?.readings ?? []}
            isLoading={currentLoading}
            selectedDate={selectedDate}
          />
        </div>
      )}

      {activeTab === 'MONTH_TO_DATE' && (
        <div className="space-y-6">
          <ReportSummaryCards
            highest={mtdReport?.highest ?? null}
            lowest={mtdReport?.lowest ?? null}
            average={mtdReport?.average ?? null}
            count={mtdReport?.count ?? 0}
            isLoading={currentLoading}
          />
          <GlucoseTrendChart
            dailyTrend={mtdReport?.dailyTrend ?? []}
            isLoading={currentLoading}
            title="Month-to-Date Glucose Trend"
            subtitle={`Daily average glucose from ${mtdReport?.startDate || ''} to ${mtdReport?.endDate || ''}`}
            emptyMessage="No glucose readings recorded for this month to date."
          />
        </div>
      )}

      {activeTab === 'PREVIOUS_MONTH' && (
        <div className="space-y-6">
          <ReportSummaryCards
            highest={prevMonthReport?.highest ?? null}
            lowest={prevMonthReport?.lowest ?? null}
            average={prevMonthReport?.average ?? null}
            count={prevMonthReport?.count ?? 0}
            isLoading={currentLoading}
          />
          <GlucoseTrendChart
            dailyTrend={prevMonthReport?.dailyTrend ?? []}
            isLoading={currentLoading}
            title="Previous Month Daily Glucose Trend"
            subtitle={`Entire preceding calendar month: ${prevMonthReport?.startDate || ''} to ${prevMonthReport?.endDate || ''}`}
            emptyMessage="No glucose readings found for the previous calendar month."
          />
        </div>
      )}
    </div>
  );
};
