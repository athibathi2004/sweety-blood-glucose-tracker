import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { DailyTrendPoint } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface GlucoseTrendChartProps {
  dailyTrend: DailyTrendPoint[];
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
}

interface CustomTooltipPayload {
  date: string;
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

const CustomChartTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as CustomTooltipPayload;
    if (!data) return null;

    return (
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
        <div className="font-semibold text-foreground border-b border-border/80 pb-1 flex items-center justify-between">
          <span>{data.date}</span>
          <span className="text-[10px] text-muted-foreground font-normal">
            {data.count} {data.count === 1 ? 'reading' : 'readings'}
          </span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-primary font-medium">
            <span>Daily Average:</span>
            <span className="font-mono font-bold">{data.average} mg/dl</span>
          </div>
          {data.count > 1 && (
            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
              <span>Range:</span>
              <span className="font-mono">
                {data.lowest} – {data.highest} mg/dl
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const GlucoseTrendChart: React.FC<GlucoseTrendChartProps> = ({
  dailyTrend,
  isLoading = false,
  title,
  subtitle,
  emptyMessage = 'No glucose readings found for this month.',
}) => {
  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-3 w-64 bg-muted/60 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-muted/30 rounded-lg animate-pulse flex items-center justify-center text-xs text-muted-foreground">
            Loading trend visualization...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dailyTrend.length === 0) {
    return (
      <Card className="border-border border-dashed bg-card/50">
        <CardContent className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">{emptyMessage}</h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            Daily average glucose trends will be charted here once readings are recorded in this calendar range.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format short date for X-axis: e.g. "2026-10-15" -> "15" or "Oct 15"
  const formattedData = dailyTrend.map((point) => {
    const parts = point.date.split('-');
    const day = parts[2] || point.date;
    const month = parts[1] || '';
    return {
      ...point,
      shortLabel: `${month}/${day}`,
    };
  });

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Aggregation: <span className="font-medium text-foreground">Daily Arithmetic Mean</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="shortLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                unit=" mg/dl"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: '#14b8a6',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#0f766e',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
                name="Daily Average"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
