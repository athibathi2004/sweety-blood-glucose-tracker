import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, RefreshCw, Activity, AlertCircle, Plus } from 'lucide-react';
import { readingApi, ReadingFilters } from '@/services/readingApi';
import { Reading, TimeSlot } from '@/types';
import { TIME_SLOT_LABELS } from '@/types/readingConstants';
import { ReadingCard } from './ReadingCard';
import { Button } from '@/components/ui/button';

interface ReadingHistoryProps {
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
  onOpenAddModal: () => void;
}

export const ReadingHistory: React.FC<ReadingHistoryProps> = ({
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [filters, setFilters] = useState<ReadingFilters>({});

  const {
    data: readings,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Reading[]>({
    queryKey: ['readings', filters],
    queryFn: () => readingApi.getReadings(filters),
  });

  const hasActiveFilters = Boolean(filters.date || filters.month || filters.timeSlot);

  const resetFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border bg-card/60 backdrop-blur-sm gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">Filter History:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Specific Date Filter */}
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                date: e.target.value || undefined,
                month: undefined, // Clear month if specific date is selected
              }));
            }}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            title="Filter by specific date"
          />

          {/* Month Filter */}
          <input
            type="month"
            value={filters.month || ''}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                month: e.target.value || undefined,
                date: undefined, // Clear specific date if month is selected
              }));
            }}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            title="Filter by month"
          />

          {/* TimeSlot Filter */}
          <select
            value={filters.timeSlot || ''}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                timeSlot: (e.target.value as TimeSlot) || undefined,
              }));
            }}
            className="h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Time Slots</option>
            {Object.entries(TIME_SLOT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 p-0"
            title="Refresh readings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {/* Content States */}
      {isLoading ? (
        // Loading Skeleton
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border bg-card/60 p-4 animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 bg-muted rounded-lg" />
                <div className="space-y-2">
                  <div className="w-28 h-4 bg-muted rounded" />
                  <div className="w-36 h-3 bg-muted rounded" />
                </div>
              </div>
              <div className="w-20 h-8 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        // Error State
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : 'Failed to load reading history.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : readings && readings.length > 0 ? (
        // Readings List
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">
              Showing {readings.length} {readings.length === 1 ? 'reading' : 'readings'}
            </span>
          </div>

          <div className="space-y-2.5">
            {readings.map((reading) => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        // Empty State
        <div className="p-10 rounded-2xl border border-border bg-card/70 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-foreground">
              {hasActiveFilters ? 'No readings match your filter' : 'No glucose readings yet'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hasActiveFilters
                ? 'Try adjusting or clearing your date and slot filters to see more entries.'
                : 'Start tracking your blood sugar. You can log up to four readings per day for morning and post-meal intervals.'}
            </p>
          </div>
          <div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear Active Filters
              </Button>
            ) : (
              <Button size="sm" onClick={onOpenAddModal} className="gap-1.5 font-medium">
                <Plus className="w-4 h-4" />
                Log Your First Reading
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
