import { TimeSlot } from './reading';

export interface DailyReadingItem {
  id: string;
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  timeSlotLabel: string;
  glucoseValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReportResponse {
  reportType: 'DAILY';
  date: string; // YYYY-MM-DD
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  readings: DailyReadingItem[];
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  average: number; // Daily average glucose rounded to 1 decimal
  highest: number;
  lowest: number;
  count: number;
}

export interface MonthToDateReportResponse {
  reportType: 'MONTH_TO_DATE';
  startDate: string; // YYYY-MM-01
  endDate: string; // YYYY-MM-DD (selectedDate)
  selectedDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  dailyTrend: DailyTrendPoint[];
}

export interface PreviousMonthReportResponse {
  reportType: 'PREVIOUS_MONTH';
  startDate: string; // YYYY-MM-01 of previous month
  endDate: string; // Last day of previous month
  selectedDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  dailyTrend: DailyTrendPoint[];
}
