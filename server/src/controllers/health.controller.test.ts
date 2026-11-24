import request from 'supertest';
import { app } from '../app';

describe('Health Controller - GET /api/health', () => {
  it('should return 200 OK with healthy status payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status', 'ok');
    expect(response.body.data).toHaveProperty('service', 'sweety-api');
    expect(response.body.data).toHaveProperty('version', '1.0.0');
    expect(response.body.data).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown endpoints', async () => {
    const response = await request(app).get('/api/non-existent-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
