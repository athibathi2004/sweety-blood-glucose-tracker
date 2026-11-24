export type TimeSlot = 'MORNING' | 'AFTER_BREAKFAST' | 'AFTER_LUNCH' | 'AFTER_DINNER';

export const TIME_SLOTS: TimeSlot[] = [
  'MORNING',
  'AFTER_BREAKFAST',
  'AFTER_LUNCH',
  'AFTER_DINNER',
];

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

export interface ReadingResponse {
  id: string;
  userId: string;
  readingDate: string; // Canonical YYYY-MM-DD
  timeSlot: TimeSlot;
  glucoseValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingFilters {
  date?: string;
  month?: string;
  timeSlot?: TimeSlot;
}
