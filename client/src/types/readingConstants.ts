import { TimeSlot } from '@/types';

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

export const TIME_SLOT_ORDER: Record<TimeSlot, number> = {
  MORNING: 1,
  AFTER_BREAKFAST: 2,
  AFTER_LUNCH: 3,
  AFTER_DINNER: 4,
};

export function formatReadingDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
