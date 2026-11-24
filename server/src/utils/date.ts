/**
 * Date Utility Module
 * Handles date-only operations for PostgreSQL DATE columns (YYYY-MM-DD)
 * to prevent unintended timezone offsets across client, server, and database.
 */

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validates whether a given string is in strict ISO YYYY-MM-DD format and a real calendar day.
 */
export function isValidDateOnlyString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month! - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Validates whether a string is in YYYY-MM format.
 */
export function isValidMonthString(value: string): boolean {
  return MONTH_REGEX.test(value);
}

/**
 * Gets today's calendar date string (YYYY-MM-DD).
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given YYYY-MM-DD date string is strictly in the future.
 * Accounts for both local calendar date and UTC date to avoid false positives across timezones.
 */
export function isFutureDate(dateStr: string): boolean {
  const todayLocal = getTodayDateString();
  const todayUtc = new Date().toISOString().split('T')[0]!;
  // A date is considered future only if it exceeds BOTH local and UTC calendar days
  return dateStr > todayLocal && dateStr > todayUtc;
}

/**
 * Returns the start and end YYYY-MM-DD dates for a given YYYY-MM month string.
 */
export function getMonthDateRange(monthStr: string): { startDate: string; endDate: string } {
  if (!isValidMonthString(monthStr)) {
    throw new Error(`Invalid month string: ${monthStr}. Expected YYYY-MM`);
  }
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = `${monthStr}-01`;
  // Day 0 of next month is the last day of current month (pure UTC)
  const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

/**
 * Returns the inclusive start (first day of month) and end (selected date)
 * for a Month-to-Date range based on a YYYY-MM-DD date string.
 * Example: '2026-10-15' -> { startDate: '2026-10-01', endDate: '2026-10-15' }
 */
export function getMonthToDateRange(dateStr: string): { startDate: string; endDate: string } {
  if (!isValidDateOnlyString(dateStr)) {
    throw new Error(`Invalid date-only string: ${dateStr}. Expected YYYY-MM-DD`);
  }
  const [year, month] = dateStr.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = dateStr;
  return { startDate, endDate };
}

/**
 * Returns the inclusive start (first day of previous calendar month) and
 * end (last day of previous calendar month) based on a YYYY-MM-DD date string.
 * Handles January seamlessly by transitioning to December of previous year.
 * Handles leap years and variable month lengths in pure UTC.
 * Example: '2026-10-15' -> { startDate: '2026-09-01', endDate: '2026-09-30' }
 * Example: '2026-01-15' -> { startDate: '2025-12-01', endDate: '2025-12-31' }
 */
export function getPreviousMonthDateRange(dateStr: string): { startDate: string; endDate: string } {
  if (!isValidDateOnlyString(dateStr)) {
    throw new Error(`Invalid date-only string: ${dateStr}. Expected YYYY-MM-DD`);
  }
  const [yearNum, monthNum] = dateStr.split('-').map(Number);
  let prevYear = yearNum!;
  let prevMonth = monthNum! - 1;

  if (prevMonth === 0) {
    prevYear -= 1;
    prevMonth = 12;
  }

  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const startDate = `${prevYear}-${prevMonthStr}-01`;

  // Day 0 of month (prevMonth in 1-based index) in Date.UTC returns last day of prevMonth
  const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const endDate = `${prevYear}-${prevMonthStr}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}

/**
 * Normalizes a YYYY-MM-DD string or Date object into a pure UTC Date
 * representing midnight UTC (00:00:00.000Z).
 * When saved into a PostgreSQL DATE column via Prisma `@db.Date`,
 * this preserves the exact date without timezone drift.
 */
export function parseDateOnly(input: string | Date): Date {
  if (typeof input === 'string') {
    if (!isValidDateOnlyString(input)) {
      throw new Error(`Invalid date-only string format: expected YYYY-MM-DD, received "${input}"`);
    }
    const [year, month, day] = input.split('-').map(Number);
    return new Date(Date.UTC(year!, month! - 1, day!));
  }

  // If already a Date object, extract UTC calendar components
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

/**
 * Formats a Date object or date-only string into canonical YYYY-MM-DD string.
 */
export function formatDateOnly(input: Date | string): string {
  if (typeof input === 'string') {
    if (isValidDateOnlyString(input)) return input;
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new Error(`Invalid date input: ${input}`);
    return d.toISOString().split('T')[0]!;
  }
  return input.toISOString().split('T')[0]!;
}
