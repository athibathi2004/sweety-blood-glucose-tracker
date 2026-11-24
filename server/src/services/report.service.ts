import { prisma } from '../config/database';
import {
  parseDateOnly,
  formatDateOnly,
  getMonthToDateRange,
  getPreviousMonthDateRange,
} from '../utils/date';
import { TimeSlot, TIME_SLOT_LABELS, TIME_SLOT_ORDER } from '../types/reading';
import {
  DailyReportResponse,
  MonthToDateReportResponse,
  PreviousMonthReportResponse,
  DailyReadingItem,
  DailyTrendPoint,
} from '../types/report';

export class ReportService {
  /**
   * Generates a Daily Report for a single calendar date.
   * Returns highest, lowest, average (rounded to 1 decimal), count, and sorted readings.
   */
  public async getDailyReport(userId: string, dateStr: string): Promise<DailyReportResponse> {
    const targetDate = parseDateOnly(dateStr);

    const records = await prisma.reading.findMany({
      where: {
        userId,
        readingDate: targetDate,
      },
    });

    // Sort slots in consistent chronological meal order:
    // 1. Morning -> 2. After breakfast -> 3. After lunch -> 4. After dinner
    records.sort((a, b) => {
      const orderA = TIME_SLOT_ORDER[a.timeSlot as TimeSlot] || 0;
      const orderB = TIME_SLOT_ORDER[b.timeSlot as TimeSlot] || 0;
      return orderA - orderB;
    });

    const count = records.length;
    let highest: number | null = null;
    let lowest: number | null = null;
    let average: number | null = null;

    if (count > 0) {
      highest = Math.max(...records.map((r) => r.glucoseValue));
      lowest = Math.min(...records.map((r) => r.glucoseValue));
      const sum = records.reduce((acc, r) => acc + r.glucoseValue, 0);
      average = Math.round((sum / count) * 10) / 10;
    }

    const readings: DailyReadingItem[] = records.map((r) => ({
      id: r.id,
      readingDate: formatDateOnly(r.readingDate),
      timeSlot: r.timeSlot as TimeSlot,
      timeSlotLabel: TIME_SLOT_LABELS[r.timeSlot as TimeSlot] || r.timeSlot,
      glucoseValue: r.glucoseValue,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return {
      reportType: 'DAILY',
      date: dateStr,
      highest,
      lowest,
      average,
      count,
      readings,
    };
  }

  /**
   * Generates a Month-to-Date Report from the 1st of the month through selectedDate inclusive.
   * Aggregates stats directly from individual readings and computes daily trends.
   */
  public async getMonthToDateReport(
    userId: string,
    dateStr: string
  ): Promise<MonthToDateReportResponse> {
    const { startDate, endDate } = getMonthToDateRange(dateStr);

    const records = await prisma.reading.findMany({
      where: {
        userId,
        readingDate: {
          gte: parseDateOnly(startDate),
          lte: parseDateOnly(endDate),
        },
      },
      orderBy: [{ readingDate: 'asc' }],
    });

    const count = records.length;
    let highest: number | null = null;
    let lowest: number | null = null;
    let average: number | null = null;

    if (count > 0) {
      highest = Math.max(...records.map((r) => r.glucoseValue));
      lowest = Math.min(...records.map((r) => r.glucoseValue));
      const sum = records.reduce((acc, r) => acc + r.glucoseValue, 0);
      average = Math.round((sum / count) * 10) / 10;
    }

    const dailyTrend = this.buildDailyTrend(records);

    return {
      reportType: 'MONTH_TO_DATE',
      startDate,
      endDate,
      selectedDate: dateStr,
      highest,
      lowest,
      average,
      count,
      dailyTrend,
    };
  }

  /**
   * Generates a Previous-Month Report for the entire preceding calendar month.
   * Seamlessly handles year transitions (January -> December of prior year) and leap years.
   */
  public async getPreviousMonthReport(
    userId: string,
    dateStr: string
  ): Promise<PreviousMonthReportResponse> {
    const { startDate, endDate } = getPreviousMonthDateRange(dateStr);

    const records = await prisma.reading.findMany({
      where: {
        userId,
        readingDate: {
          gte: parseDateOnly(startDate),
          lte: parseDateOnly(endDate),
        },
      },
      orderBy: [{ readingDate: 'asc' }],
    });

    const count = records.length;
    let highest: number | null = null;
    let lowest: number | null = null;
    let average: number | null = null;

    if (count > 0) {
      highest = Math.max(...records.map((r) => r.glucoseValue));
      lowest = Math.min(...records.map((r) => r.glucoseValue));
      const sum = records.reduce((acc, r) => acc + r.glucoseValue, 0);
      average = Math.round((sum / count) * 10) / 10;
    }

    const dailyTrend = this.buildDailyTrend(records);

    return {
      reportType: 'PREVIOUS_MONTH',
      startDate,
      endDate,
      selectedDate: dateStr,
      highest,
      lowest,
      average,
      count,
      dailyTrend,
    };
  }

  /**
   * Helper to aggregate individual readings by calendar day for trend charts.
   * Computes daily average (rounded to 1 decimal), min, max, and count.
   */
  private buildDailyTrend(records: Array<{ readingDate: Date; glucoseValue: number }>): DailyTrendPoint[] {
    const dayGroups = new Map<string, number[]>();

    for (const r of records) {
      const dStr = formatDateOnly(r.readingDate);
      const list = dayGroups.get(dStr) || [];
      list.push(r.glucoseValue);
      dayGroups.set(dStr, list);
    }

    return Array.from(dayGroups.entries())
      .map(([dStr, vals]) => {
        const daySum = vals.reduce((a, b) => a + b, 0);
        return {
          date: dStr,
          average: Math.round((daySum / vals.length) * 10) / 10,
          highest: Math.max(...vals),
          lowest: Math.min(...vals),
          count: vals.length,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const reportService = new ReportService();
