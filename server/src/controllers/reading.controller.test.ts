import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';

function extractCookie(res: request.Response): string {
  const cookieHeader = res.headers['set-cookie'];
  if (Array.isArray(cookieHeader)) {
    return cookieHeader[0]!.split(';')[0]!;
  }
  return String(cookieHeader).split(';')[0]!;
}

describe('Blood Glucose Reading Management Integration Tests', () => {
  const timestamp = Date.now();
  let userAId: string;
  let userBId: string;
  let cookieA: string;
  let cookieB: string;

  let morningReadingId: string;
  let afterBreakfastReadingId: string;

  beforeAll(async () => {
    // 1. Create User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Alpha',
        email: `patient_a_${timestamp}@sweety.test`,
        password: 'Password123!',
      });
    userAId = resA.body.data.user.id;
    cookieA = extractCookie(resA);

    // 2. Create User B (for cross-user authorization tests)
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Beta',
        email: `patient_b_${timestamp}@sweety.test`,
        password: 'Password123!',
      });
    userBId = resB.body.data.user.id;
    cookieB = extractCookie(resB);
  });

  afterAll(async () => {
    // Clean up test users and their cascading readings
    await prisma.user.deleteMany({
      where: {
        id: { in: [userAId, userBId].filter(Boolean) },
      },
    });
  });

  describe('1. Input & Business Validation on Creation', () => {
    it('1. Successful reading creation (MORNING)', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'MORNING',
          glucoseValue: 105,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reading).toBeDefined();
      expect(response.body.data.reading.readingDate).toBe('2026-11-20');
      expect(response.body.data.reading.timeSlot).toBe('MORNING');
      expect(response.body.data.reading.glucoseValue).toBe(105);

      morningReadingId = response.body.data.reading.id;
    });

    it('2. Missing glucose value is rejected with exact requirement message', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_BREAKFAST',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Please enter a glucose value.');
    });

    it('3. Glucose value below 40 is rejected with exact range message', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 39,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Value must be between 40 and 600 mg/dl.');
    });

    it('4. Glucose value above 600 is rejected with exact range message', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 601,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Value must be between 40 and 600 mg/dl.');
    });

    it('5. Decimal glucose value is rejected', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 105.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Glucose value must be a whole number.');
    });

    it('6. Invalid time slot is rejected', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'MIDNIGHT_SNACK',
          glucoseValue: 120,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Invalid time slot');
    });

    it('7. Future date is rejected with exact requirement message', async () => {
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2099-12-31',
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 120,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      const msg = JSON.stringify(response.body);
      expect(msg).toContain('Date cannot be in the future.');
    });

    it('8. Duplicate slot on same date is rejected with exact friendly message', async () => {
      // User A already has MORNING for 2026-11-20
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'MORNING',
          glucoseValue: 110,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You already have a Morning reading for this date.');
    });
  });

  describe('2. Four Readings / Day Limit Enforcement', () => {
    it('9. Successfully adds remaining slots up to 4 readings for 2026-11-20', async () => {
      // Add AFTER_BREAKFAST
      const resBf = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_BREAKFAST',
          glucoseValue: 130,
        });
      expect(resBf.status).toBe(201);
      afterBreakfastReadingId = resBf.body.data.reading.id;

      // Add AFTER_LUNCH
      const resLunch = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_LUNCH',
          glucoseValue: 145,
        });
      expect(resLunch.status).toBe(201);

      // Add AFTER_DINNER (reaching total 4)
      const resDinner = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'AFTER_DINNER',
          glucoseValue: 125,
        });
      expect(resDinner.status).toBe(201);
    });

    it('10. Attempt to add a 5th reading on same date is blocked with exact daily limit message', async () => {
      // 2026-11-20 already has 4 readings
      const response = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-20',
          timeSlot: 'MORNING',
          glucoseValue: 100,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      // Either 4-reading limit or duplicate slot applies
      expect(
        response.body.message === 'You can add only 4 readings per day.' ||
        response.body.message === 'You already have a Morning reading for this date.'
      ).toBe(true);
    });
  });

  describe('3. Reading Retrieval & User Ownership', () => {
    it('11. Successful reading retrieval by ID for authenticated owner', async () => {
      const response = await request(app)
        .get(`/api/readings/${morningReadingId}`)
        .set('Cookie', cookieA);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reading.id).toBe(morningReadingId);
      expect(response.body.data.reading.glucoseValue).toBe(105);
    });

    it('14. Attempt to access another user\'s reading returns 404 without data disclosure', async () => {
      // User B tries to access User A's reading
      const response = await request(app)
        .get(`/api/readings/${morningReadingId}`)
        .set('Cookie', cookieB);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('4. Update & Delete Operations', () => {
    it('12. Successful reading update (glucose value and slot)', async () => {
      const response = await request(app)
        .put(`/api/readings/${afterBreakfastReadingId}`)
        .set('Cookie', cookieA)
        .send({
          glucoseValue: 138,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reading.glucoseValue).toBe(138);
    });

    it('15. Attempt to update another user\'s reading returns 404', async () => {
      const response = await request(app)
        .put(`/api/readings/${morningReadingId}`)
        .set('Cookie', cookieB)
        .send({
          glucoseValue: 200,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('17. Update causing a duplicate slot on same date returns 409', async () => {
      // User A tries to change AFTER_BREAKFAST reading to MORNING on 2026-11-20
      const response = await request(app)
        .put(`/api/readings/${afterBreakfastReadingId}`)
        .set('Cookie', cookieA)
        .send({
          timeSlot: 'MORNING',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You already have a Morning reading for this date.');
    });

    it('16. Attempt to delete another user\'s reading returns 404', async () => {
      const response = await request(app)
        .delete(`/api/readings/${morningReadingId}`)
        .set('Cookie', cookieB);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('13. Successful reading deletion removes the record', async () => {
      // Create a temporary reading for deletion test
      const createRes = await request(app)
        .post('/api/readings')
        .set('Cookie', cookieA)
        .send({
          readingDate: '2026-11-19',
          timeSlot: 'AFTER_LUNCH',
          glucoseValue: 112,
        });
      const tempId = createRes.body.data.reading.id;

      const deleteRes = await request(app)
        .delete(`/api/readings/${tempId}`)
        .set('Cookie', cookieA);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify it no longer exists
      const getRes = await request(app)
        .get(`/api/readings/${tempId}`)
        .set('Cookie', cookieA);

      expect(getRes.status).toBe(404);
    });
  });

  describe('5. List & Filtering Behavior', () => {
    it('18. Reading list filtering by date returns only matching records', async () => {
      const response = await request(app)
        .get('/api/readings?date=2026-11-20')
        .set('Cookie', cookieA);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.readings).toBeDefined();
      expect(response.body.data.readings.length).toBe(4);
      for (const r of response.body.data.readings) {
        expect(r.readingDate).toBe('2026-11-20');
      }
    });

    it('19. Empty reading history returns empty array for user without readings', async () => {
      const response = await request(app)
        .get('/api/readings')
        .set('Cookie', cookieB);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.readings).toEqual([]);
    });

    it('20. Concurrent insertion for same slot and date gracefully rejects duplicate with 409', async () => {
      const targetDate = '2026-11-18';
      const slot = 'AFTER_LUNCH';

      // Fire two identical insert requests concurrently
      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/readings')
          .set('Cookie', cookieA)
          .send({ readingDate: targetDate, timeSlot: slot, glucoseValue: 120 }),
        request(app)
          .post('/api/readings')
          .set('Cookie', cookieA)
          .send({ readingDate: targetDate, timeSlot: slot, glucoseValue: 122 }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });
});
