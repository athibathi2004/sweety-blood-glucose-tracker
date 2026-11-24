import React from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { DailyReadingItem, TimeSlot } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DailyReadingsTableProps {
  readings: DailyReadingItem[];
  isLoading?: boolean;
  selectedDate: string;
}

const SLOT_BADGE_VARIANTS: Record<TimeSlot, 'mint' | 'lavender' | 'secondary' | 'outline'> = {
  MORNING: 'lavender',
  AFTER_BREAKFAST: 'mint',
  AFTER_LUNCH: 'secondary',
  AFTER_DINNER: 'outline',
};

export const DailyReadingsTable: React.FC<DailyReadingsTableProps> = ({
  readings,
  isLoading = false,
  selectedDate,
}) => {
  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 space-y-3">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/60 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (readings.length === 0) {
    return (
      <Card className="border-border border-dashed bg-card/50">
        <CardContent className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            No readings recorded for this date yet.
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm">
            There are no glucose measurements logged for {selectedDate}. Log a reading from the Blood Glucose Log to view daily statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Daily Measurements ({readings.length} {readings.length === 1 ? 'Reading' : 'Readings'})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-medium uppercase tracking-wider text-[10px] border-b border-border/60">
              <tr>
                <th className="py-3 px-4 sm:px-6">Meal Time Slot</th>
                <th className="py-3 px-4 sm:px-6">Glucose Level</th>
                <th className="py-3 px-4 sm:px-6">Calendar Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {readings.map((item) => {
                const badgeVariant = SLOT_BADGE_VARIANTS[item.timeSlot] || 'outline';
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant} className="text-xs font-medium gap-1 py-0.5">
                          <Clock className="w-3 h-3" />
                          {item.timeSlotLabel}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {item.glucoseValue}{' '}
                        <span className="text-[11px] font-normal text-muted-foreground">mg/dl</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">
                      {item.readingDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
