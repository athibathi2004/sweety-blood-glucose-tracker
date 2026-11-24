import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Dedicated rate limiter for authentication endpoints: 15 attempts per 15 minutes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: { code: 'AUTH_RATE_LIMIT_EXCEEDED' },
  },
  skip: () => process.env.NODE_ENV === 'test', // Bypass in automated test suites
});

// POST /api/auth/register
router.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  (req, res, next) => authController.register(req, res, next)
);

// POST /api/auth/login
router.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next)
);

// POST /api/auth/logout (Protected)
router.post(
  '/logout',
  requireAuth,
  (req, res, next) => authController.logout(req, res, next)
);

// GET /api/auth/me (Protected)
router.get(
  '/me',
  requireAuth,
  (req, res, next) => authController.getMe(req, res, next)
);

export const authRoutes = router;
