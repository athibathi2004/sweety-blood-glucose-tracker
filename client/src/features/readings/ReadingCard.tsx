import React from 'react';
import { Edit3, Trash2, Calendar, Clock } from 'lucide-react';
import { Reading, TimeSlot } from '@/types';
import { TIME_SLOT_LABELS, formatReadingDate } from '@/types/readingConstants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReadingCardProps {
  reading: Reading;
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}

const SLOT_BADGE_VARIANTS: Record<TimeSlot, 'mint' | 'lavender' | 'secondary' | 'outline'> = {
  MORNING: 'lavender',
  AFTER_BREAKFAST: 'mint',
  AFTER_LUNCH: 'secondary',
  AFTER_DINNER: 'outline',
};

export const ReadingCard: React.FC<ReadingCardProps> = ({ reading, onEdit, onDelete }) => {
  const slotLabel = TIME_SLOT_LABELS[reading.timeSlot] || reading.timeSlot;
  const badgeVariant = SLOT_BADGE_VARIANTS[reading.timeSlot] || 'outline';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-all gap-4">
      {/* Left: Date, Time Slot, and Metrics */}
      <div className="flex items-start sm:items-center gap-4">
        {/* Glucose Value Circle / Card */}
        <div className="flex flex-col items-center justify-center min-w-[76px] h-16 rounded-xl bg-muted/60 border border-border/80 px-2.5">
          <span className="text-xl font-bold tracking-tight text-foreground font-mono">
            {reading.glucoseValue}
          </span>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider -mt-0.5">
            mg/dl
          </span>
        </div>

        {/* Slot & Date Details */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} className="text-xs font-medium gap-1 py-0.5">
              <Clock className="w-3 h-3" />
              {slotLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span>{formatReadingDate(reading.readingDate)}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(reading)}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 gap-1.5"
          title="Edit reading"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Edit</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(reading)}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 gap-1.5"
          title="Delete reading"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
};
