import React from 'react';
import { TrendingUp, TrendingDown, Activity, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ReportSummaryCardsProps {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  isLoading?: boolean;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  highest,
  lowest,
  average,
  count,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border animate-pulse bg-card">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="h-6 w-20 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Highest Reading',
      value: highest !== null ? highest : '—',
      unit: highest !== null ? 'mg/dl' : '',
      subtitle: highest !== null ? 'Peak glucose level' : 'No readings logged',
      icon: TrendingUp,
      iconBg: 'bg-lavender-100 text-lavender-700',
    },
    {
      title: 'Lowest Reading',
      value: lowest !== null ? lowest : '—',
      unit: lowest !== null ? 'mg/dl' : '',
      subtitle: lowest !== null ? 'Trough glucose level' : 'No readings logged',
      icon: TrendingDown,
      iconBg: 'bg-mint-100 text-mint-700',
    },
    {
      title: 'Average Reading',
      value: average !== null ? average : '—',
      unit: average !== null ? 'mg/dl' : '',
      subtitle: average !== null ? 'Arithmetic mean' : 'No readings logged',
      icon: Activity,
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      title: 'Total Readings',
      value: count,
      unit: count === 1 ? 'reading' : 'readings',
      subtitle: count > 0 ? 'Individual data points' : 'Zero recorded',
      icon: Hash,
      iconBg: 'bg-secondary text-secondary-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="border-border bg-card shadow-sm hover:border-primary/20 transition-all"
          >
            <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                    {card.value}
                  </span>
                  {card.unit && (
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {card.unit}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
