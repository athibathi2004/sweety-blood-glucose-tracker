import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import { parseDateOnly } from '../utils/date';

function extractCookie(res: request.Response): string {
  const cookieHeader = res.headers['set-cookie'];
  if (Array.isArray(cookieHeader)) {
    return cookieHeader[0]!.split(';')[0]!;
  }
  return String(cookieHeader).split(';')[0]!;
}

describe('Glucose Analytics & Reporting Integration Tests', () => {
  const timestamp = Date.now();
  let userAId: string;
  let userBId: string;
  let cookieA: string;
  let cookieB: string;

  beforeAll(async () => {
    // 1. Create User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Report Test Patient A',
        email: `report_patient_a_${timestamp}@sweety.test`,
        password: 'Password123!',
      });
    userAId = resA.body.data.user.id;
    cookieA = extractCookie(resA);

    // 2. Create User B (for cross-user isolation tests)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Report Test Patient B',
        email: `report_patient_b_${timestamp}@sweety.test`,
        password: 'Password123!',
      });
    userBId = resB.body.data.user.id;
    cookieB = extractCookie(resB);

    // 3. Seed Seed Readings for User A
    // Date: 2026-10-15 (Target Date for Daily & MTD tests)
    // 4 readings: 95, 135, 120, 110 -> Sum = 460, Average = 115.0, Min = 95, Max = 135
    await prisma.reading.createMany({
      data: [
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-15'),
          timeSlot: 'MORNING',
          glucoseValue: 95,
        },
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-15'),
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 135,
        },
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-15'),
          timeSlot: 'AFTER_LUNCH',
          glucoseValue: 120,
        },
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-15'),
          timeSlot: 'AFTER_DINNER',
          glucoseValue: 110,
        },
        // Earlier in October 2026:
        // 2026-10-01 (First day of month)
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-01'),
          timeSlot: 'MORNING',
          glucoseValue: 100,
        },
        // 2026-10-10
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-10'),
          timeSlot: 'AFTER_LUNCH',
          glucoseValue: 150,
        },
        // Later in October 2026 (AFTER 2026-10-15):
        // Must NOT appear in MTD report for 2026-10-15
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-10-25'),
          timeSlot: 'MORNING',
          glucoseValue: 90,
        },
        // September 2026 (Previous month for 2026-10-15):
        // 2026-09-01 (First day of previous month)
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-09-01'),
          timeSlot: 'MORNING',
          glucoseValue: 102,
        },
        // 2026-09-15
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-09-15'),
          timeSlot: 'AFTER_LUNCH',
          glucoseValue: 144,
        },
        // 2026-09-30 (Last day of previous month)
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-09-30'),
          timeSlot: 'AFTER_DINNER',
          glucoseValue: 126,
        },
        // August 2026 (Prior to Sept 2026 - must NOT appear in Sept previous-month report):
        {
          userId: userAId,
          readingDate: parseDateOnly('2026-08-31'),
          timeSlot: 'AFTER_DINNER',
          glucoseValue: 80,
        },
        // December 2025 (Previous month for January 2026):
        {
          userId: userAId,
          readingDate: parseDateOnly('2025-12-01'),
          timeSlot: 'MORNING',
          glucoseValue: 98,
        },
        {
          userId: userAId,
          readingDate: parseDateOnly('2025-12-31'),
          timeSlot: 'AFTER_DINNER',
          glucoseValue: 112,
        },
      ],
    });

    // 4. Seed reading for User B on 2026-10-15 (cross-user isolation test)
    await prisma.reading.create({
      data: {
        userId: userBId,
        readingDate: parseDateOnly('2026-10-15'),
        timeSlot: 'MORNING',
        glucoseValue: 400,
      },
    });
  });

  afterAll(async () => {
    // Clean up test users and their cascading readings
    await prisma.user.deleteMany({
      where: {
        id: { in: [userAId, userBId].filter(Boolean) },
      },
    });
  });

  describe('1. Daily Report Tests', () => {
    it('1. Daily report returns correct highest, lowest, average and count', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const report = res.body.data.report || res.body.data;
      expect(report.reportType).toBe('DAILY');
      expect(report.date).toBe('2026-10-15');
      expect(report.highest).toBe(135);
      expect(report.lowest).toBe(95);
      expect(report.average).toBe(115.0);
      expect(report.count).toBe(4);
      expect(report.readings).toHaveLength(4);
    });

    it('2. Daily report returns only selected-date readings sorted in meal slot order', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      // Slot order: MORNING (1) -> AFTER_BREAKFAST (2) -> AFTER_LUNCH (3) -> AFTER_DINNER (4)
      expect(report.readings[0].timeSlot).toBe('MORNING');
      expect(report.readings[0].timeSlotLabel).toBe('Morning (fasting)');
      expect(report.readings[0].glucoseValue).toBe(95);

      expect(report.readings[1].timeSlot).toBe('AFTER_BREAKFAST');
      expect(report.readings[1].timeSlotLabel).toBe('After breakfast');
      expect(report.readings[1].glucoseValue).toBe(135);

      expect(report.readings[2].timeSlot).toBe('AFTER_LUNCH');
      expect(report.readings[2].timeSlotLabel).toBe('After lunch');
      expect(report.readings[2].glucoseValue).toBe(120);

      expect(report.readings[3].timeSlot).toBe('AFTER_DINNER');
      expect(report.readings[3].timeSlotLabel).toBe('After dinner');
      expect(report.readings[3].glucoseValue).toBe(110);
    });

    it('8. Empty daily report returns null statistics and count zero', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-05-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      expect(report.highest).toBeNull();
      expect(report.lowest).toBeNull();
      expect(report.average).toBeNull();
      expect(report.count).toBe(0);
      expect(report.readings).toEqual([]);
    });
  });

  describe('2. Month-to-Date Report Tests', () => {
    it('3. Month-to-date uses the first day of selected month (includes 2026-10-01)', async () => {
      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      expect(report.reportType).toBe('MONTH_TO_DATE');
      expect(report.startDate).toBe('2026-10-01');
      expect(report.endDate).toBe('2026-10-15');

      // Daily trend must include 2026-10-01
      const trendDates = report.dailyTrend.map((t: { date: string }) => t.date);
      expect(trendDates).toContain('2026-10-01');
    });

    it('4. Month-to-date includes the selected date and excludes dates after it', async () => {
      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      // Included dates for User A up to Oct 15:
      // Oct 1 (100) + Oct 10 (150) + Oct 15 (95, 135, 120, 110)
      // Total count: 1 + 1 + 4 = 6 readings
      // Sum = 100 + 150 + 95 + 135 + 120 + 110 = 710
      // Average = 710 / 6 = 118.333... -> 118.3
      // Oct 25 (90) is excluded!
      expect(report.count).toBe(6);
      expect(report.highest).toBe(150);
      expect(report.lowest).toBe(95);
      expect(report.average).toBe(118.3);

      const trendDates = report.dailyTrend.map((t: { date: string }) => t.date);
      expect(trendDates).toContain('2026-10-15');
      expect(trendDates).not.toContain('2026-10-25');
    });
  });

  describe('3. Previous-Month Report Tests', () => {
    it('5. Previous-month report returns the entire previous calendar month (September)', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      expect(report.reportType).toBe('PREVIOUS_MONTH');
      expect(report.startDate).toBe('2026-09-01');
      expect(report.endDate).toBe('2026-09-30');

      // In September: 2026-09-01 (102), 2026-09-15 (144), 2026-09-30 (126)
      // Total count = 3 readings
      // Sum = 102 + 144 + 126 = 372
      // Average = 372 / 3 = 124.0
      // August 31 (80) and October 1 (100) are excluded
      expect(report.count).toBe(3);
      expect(report.highest).toBe(144);
      expect(report.lowest).toBe(102);
      expect(report.average).toBe(124.0);

      const trendDates = report.dailyTrend.map((t: { date: string }) => t.date);
      expect(trendDates).toEqual(['2026-09-01', '2026-09-15', '2026-09-30']);
      expect(trendDates).not.toContain('2026-08-31');
      expect(trendDates).not.toContain('2026-10-01');
    });

    it('5b. Alias route /api/reports/previous-month behaves identically', async () => {
      const res = await request(app)
        .get('/api/reports/previous-month?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;
      expect(report.count).toBe(3);
      expect(report.startDate).toBe('2026-09-01');
      expect(report.endDate).toBe('2026-09-30');
    });

    it('6. Previous-month calculation handles January correctly (transitions to December of prior year)', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-01-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      expect(report.startDate).toBe('2025-12-01');
      expect(report.endDate).toBe('2025-12-31');
      // In December 2025: 2025-12-01 (98), 2025-12-31 (112)
      // Sum = 210, Count = 2, Average = 105.0
      expect(report.count).toBe(2);
      expect(report.highest).toBe(112);
      expect(report.lowest).toBe(98);
      expect(report.average).toBe(105.0);
    });

    it('9. Empty monthly report returns null statistics and count zero', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-05-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;

      expect(report.startDate).toBe('2026-04-01');
      expect(report.endDate).toBe('2026-04-30');
      expect(report.highest).toBeNull();
      expect(report.lowest).toBeNull();
      expect(report.average).toBeNull();
      expect(report.count).toBe(0);
      expect(report.dailyTrend).toEqual([]);
    });
  });

  describe('4. Statistical Precision & Edge Cases', () => {
    it('7. Average is rounded to one decimal place accurately', async () => {
      // In MTD report for 2026-10-15:
      // Sum = 710, Count = 6. 710 / 6 = 118.333333... -> Must be 118.3
      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Cookie', cookieA);

      expect(res.status).toBe(200);
      const report = res.body.data.report || res.body.data;
      expect(report.average).toBe(118.3);
      // Ensure it is a number with at most 1 decimal
      expect(Number.isFinite(report.average)).toBe(true);
      expect(report.average.toString()).toMatch(/^\d+(\.\d)?$/);
    });
  });

  describe('5. Authorization & Multi-User Isolation', () => {
    it('10. Readings from another user are excluded', async () => {
      // User B logged 400 mg/dl on 2026-10-15.
      // User A's daily report on 2026-10-15 must have highest = 135, NOT 400.
      const resA = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Cookie', cookieA);

      const reportA = resA.body.data.report || resA.body.data;
      expect(reportA.highest).toBe(135);
      expect(reportA.readings.some((r: { glucoseValue: number }) => r.glucoseValue === 400)).toBe(false);

      // User B's report on 2026-10-15 must have highest = 400 and count = 1
      const resB = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Cookie', cookieB);

      const reportB = resB.body.data.report || resB.body.data;
      expect(reportB.highest).toBe(400);
      expect(reportB.count).toBe(1);
    });

    it('11. Unauthenticated requests are rejected with 401', async () => {
      const res = await request(app).get('/api/reports/daily?date=2026-10-15');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Input Validation & Boundaries', () => {
    it('12. Invalid date format is rejected with 400', async () => {
      const res1 = await request(app)
        .get('/api/reports/daily?date=invalid-date')
        .set('Cookie', cookieA);

      expect(res1.status).toBe(400);
      expect(res1.body.success).toBe(false);

      // Impossible calendar date (Feb 31)
      const res2 = await request(app)
        .get('/api/reports/daily?date=2026-02-31')
        .set('Cookie', cookieA);

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
    });

    it('13. Future selected date is rejected with 400', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2099-12-31')
        .set('Cookie', cookieA);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toContain('Date cannot be in the future.');
    });
  });
});
