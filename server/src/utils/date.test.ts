import {
  isValidDateOnlyString,
  parseDateOnly,
  formatDateOnly,
  isFutureDate,
  getMonthDateRange,
  getMonthToDateRange,
  getPreviousMonthDateRange,
  getTodayDateString,
} from './date';

describe('Date Utility - Timezone-Resilient Date-Only Handling', () => {
  describe('isValidDateOnlyString', () => {
    it('should validate valid ISO YYYY-MM-DD calendar dates', () => {
      expect(isValidDateOnlyString('2026-11-23')).toBe(true);
      expect(isValidDateOnlyString('2026-01-01')).toBe(true);
      expect(isValidDateOnlyString('2026-12-31')).toBe(true);
      expect(isValidDateOnlyString('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid calendar dates and bad formats', () => {
      expect(isValidDateOnlyString('2025-02-29')).toBe(false); // Non-leap year
      expect(isValidDateOnlyString('2026-04-31')).toBe(false); // April has 30 days
      expect(isValidDateOnlyString('2026-13-01')).toBe(false); // Month 13
      expect(isValidDateOnlyString('23-11-2026')).toBe(false); // DD-MM-YYYY
      expect(isValidDateOnlyString('2026/11/23')).toBe(false); // Slashes
      expect(isValidDateOnlyString('2026-11-23T10:00:00Z')).toBe(false); // ISO timestamp
      expect(isValidDateOnlyString('random-string')).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should identify future dates correctly', () => {
      expect(isFutureDate('2099-01-01')).toBe(true);
    });

    it('should allow past and today dates', () => {
      expect(isFutureDate('2020-01-01')).toBe(false);
      expect(isFutureDate(getTodayDateString())).toBe(false);
    });
  });

  describe('getMonthDateRange', () => {
    it('should return correct start and end date for February in non-leap year', () => {
      const { startDate, endDate } = getMonthDateRange('2025-02');
      expect(startDate).toBe('2025-02-01');
      expect(endDate).toBe('2025-02-28');
    });

    it('should return correct start and end date for February in leap year', () => {
      const { startDate, endDate } = getMonthDateRange('2024-02');
      expect(startDate).toBe('2024-02-01');
      expect(endDate).toBe('2024-02-29');
    });

    it('should return correct start and end date for 30-day and 31-day months', () => {
      const nov = getMonthDateRange('2026-11');
      expect(nov.startDate).toBe('2026-11-01');
      expect(nov.endDate).toBe('2026-11-30');

      const dec = getMonthDateRange('2026-12');
      expect(dec.startDate).toBe('2026-12-01');
      expect(dec.endDate).toBe('2026-12-31');
    });
  });

  describe('getMonthToDateRange', () => {
    it('should return start of month and selected date inclusive', () => {
      const range = getMonthToDateRange('2026-10-15');
      expect(range.startDate).toBe('2026-10-01');
      expect(range.endDate).toBe('2026-10-15');
    });

    it('should work when selected date is the first day of the month', () => {
      const range = getMonthToDateRange('2026-11-01');
      expect(range.startDate).toBe('2026-11-01');
      expect(range.endDate).toBe('2026-11-01');
    });

    it('should work when selected date is the last day of the month', () => {
      const range = getMonthToDateRange('2026-11-30');
      expect(range.startDate).toBe('2026-11-01');
      expect(range.endDate).toBe('2026-11-30');
    });
  });

  describe('getPreviousMonthDateRange', () => {
    it('should calculate entire previous calendar month for regular months', () => {
      const range = getPreviousMonthDateRange('2026-10-15');
      expect(range.startDate).toBe('2026-09-01');
      expect(range.endDate).toBe('2026-09-30');
    });

    it('should handle January correctly by transitioning to December of previous year', () => {
      const range = getPreviousMonthDateRange('2026-01-15');
      expect(range.startDate).toBe('2025-12-01');
      expect(range.endDate).toBe('2025-12-31');
    });

    it('should handle leap year February correctly', () => {
      const leapRange = getPreviousMonthDateRange('2024-03-10');
      expect(leapRange.startDate).toBe('2024-02-01');
      expect(leapRange.endDate).toBe('2024-02-29');
    });

    it('should handle non-leap year February correctly', () => {
      const nonLeapRange = getPreviousMonthDateRange('2025-03-10');
      expect(nonLeapRange.startDate).toBe('2025-02-01');
      expect(nonLeapRange.endDate).toBe('2025-02-28');
    });
  });

  describe('parseDateOnly', () => {
    it('should convert YYYY-MM-DD into a pure UTC date at 00:00:00.000Z', () => {
      const parsed = parseDateOnly('2026-11-23');

      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(10); // 0-indexed November
      expect(parsed.getUTCDate()).toBe(23);
      expect(parsed.getUTCHours()).toBe(0);
      expect(parsed.getUTCMinutes()).toBe(0);
      expect(parsed.getUTCSeconds()).toBe(0);
      expect(parsed.getUTCMilliseconds()).toBe(0);
      expect(parsed.toISOString()).toBe('2026-11-23T00:00:00.000Z');
    });

    it('should extract UTC date components from an existing Date object', () => {
      const existing = new Date(Date.UTC(2026, 5, 15, 18, 30, 0));
      const normalized = parseDateOnly(existing);

      expect(normalized.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    });

    it('should throw an error for malformed date string', () => {
      expect(() => parseDateOnly('2026-02-30')).toThrow(/Invalid date-only string format/);
    });
  });

  describe('formatDateOnly', () => {
    it('should format Date objects to canonical YYYY-MM-DD without timezone drift', () => {
      const date = new Date(Date.UTC(2026, 10, 23, 0, 0, 0));
      expect(formatDateOnly(date)).toBe('2026-11-23');
    });

    it('should return valid date strings unchanged', () => {
      expect(formatDateOnly('2026-11-23')).toBe('2026-11-23');
    });

    it('should convert ISO datetime string to YYYY-MM-DD', () => {
      expect(formatDateOnly('2026-11-23T00:00:00.000Z')).toBe('2026-11-23');
    });
  });
});
