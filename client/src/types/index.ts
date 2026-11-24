export type TimeSlot = 'MORNING' | 'AFTER_BREAKFAST' | 'AFTER_LUNCH' | 'AFTER_DINNER';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reading {
  id: string;
  userId: string;
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  glucoseValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}

export interface AuthResponseData {
  user: User;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface DailyReadingItem {
  id: string;
  readingDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  timeSlotLabel: string;
  glucoseValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
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
  average: number;
  highest: number;
  lowest: number;
  count: number;
}

export interface MonthToDateReport {
  reportType: 'MONTH_TO_DATE';
  startDate: string;
  endDate: string;
  selectedDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  dailyTrend: DailyTrendPoint[];
}

export interface PreviousMonthReport {
  reportType: 'PREVIOUS_MONTH';
  startDate: string;
  endDate: string;
  selectedDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
  dailyTrend: DailyTrendPoint[];
}

export interface LoginFormData {
  email: string;
  password: string;
}
