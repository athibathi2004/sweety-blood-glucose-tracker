import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AUTH_COOKIE_NAME } from '../services/auth.service';

describe('Authentication & User Management Integration Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Healthcare Test Patient',
    email: `patient_${timestamp}@sweety.test`,
    password: 'ValidPassword123!',
  };

  const createdUserIds: string[] = [];
  let authCookie: string;

  afterAll(async () => {
    // Clean up created test accounts to maintain database isolation
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  });

  describe('1. Registration Flow', () => {
    it('1. Successful registration returns 201, user profile, and sets HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBeDefined();
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase());
      // Ensure password is never exposed in response
      expect(response.body.data.user.password).toBeUndefined();

      // Check HttpOnly cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain(AUTH_COOKIE_NAME);
      expect(cookieStr).toContain('HttpOnly');

      createdUserIds.push(response.body.data.user.id);
    });

    it('2. Password is cryptographically hashed and not stored in plaintext', async () => {
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser!.password).not.toBe(testUser.password);
      expect(dbUser!.password.startsWith('$2')).toBe(true); // bcrypt signature
      const isMatch = await bcrypt.compare(testUser.password, dbUser!.password);
      expect(isMatch).toBe(true);
    });

    it('3. Duplicate email registration is rejected with 409 Conflict', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: testUser.email.toUpperCase(), // Test case-insensitive normalization
          password: 'AnotherPassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('3b. Rejects registration with password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password',
          email: `short_pw_${timestamp}@sweety.test`,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. Login Flow', () => {
    it('4. Successful login returns 200, user profile, and sets HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.data.user.password).toBeUndefined();

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
      expect(cookieStr).toContain(AUTH_COOKIE_NAME);
      expect(cookieStr).toContain('HttpOnly');

      // Store cookie for subsequent protected route tests
      authCookie = cookieStr as string;
    });

    it('5. Incorrect password is rejected with generic 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword999!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('6. Unknown email produces generic 401 authentication error without user enumeration', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown_patient_999999@sweety.test',
          password: 'AnyPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('3. Protected Session Flow (/api/auth/me)', () => {
    it('7. GET /api/auth/me rejects unauthenticated requests with 401', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('8. GET /api/auth/me returns the authenticated user when valid cookie is provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(response.body.data.user.name).toBe(testUser.name);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('9. Logout clears cookie AND invalidates previous session token server-side', async () => {
      // 1. Perform logout with the active session cookie
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', authCookie);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Verify cookie clearance header
      const clearCookies = logoutResponse.headers['set-cookie'];
      const clearCookieStr = Array.isArray(clearCookies) ? clearCookies.join(';') : clearCookies;
      expect(clearCookieStr).toMatch(new RegExp(`${AUTH_COOKIE_NAME}=;`));

      // 2. Attempt to use the previous token on /api/auth/me -> Must be rejected!
      const meAfterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(meAfterLogout.status).toBe(401);
      expect(meAfterLogout.body.success).toBe(false);
      expect(meAfterLogout.body.error.code).toBe('SESSION_REVOKED');
    });

    it('10a. Invalid or forged token is rejected with 401', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${AUTH_COOKIE_NAME}=forged.tampered.token`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('10b. Expired token is rejected with 401', async () => {
      // Forge a token signed with the correct secret but expired in the past
      const expiredToken = jwt.sign(
        { userId: createdUserIds[0], email: testUser.email, tokenVersion: 0 },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${AUTH_COOKIE_NAME}=${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
