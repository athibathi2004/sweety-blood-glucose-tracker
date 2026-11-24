import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate';
import { reportQuerySchema } from '../validators/report.validator';

const router = Router();

// All report endpoints require authentication
router.use(requireAuth);

/**
 * GET /api/reports/daily?date=YYYY-MM-DD
 * Daily report for a single calendar date
 */
router.get(
  '/daily',
  validateRequest({ query: reportQuerySchema }),
  reportController.getDailyReport.bind(reportController)
);

/**
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 * Month-to-date report from 1st of month through selected date inclusive
 */
router.get(
  '/month-to-date',
  validateRequest({ query: reportQuerySchema }),
  reportController.getMonthToDateReport.bind(reportController)
);

/**
 * GET /api/reports/monthly?date=YYYY-MM-DD
 * Previous-month report covering the entire calendar month immediately preceding selected date
 */
router.get(
  '/monthly',
  validateRequest({ query: reportQuerySchema }),
  reportController.getMonthlyReport.bind(reportController)
);

/**
 * Alias: GET /api/reports/previous-month?date=YYYY-MM-DD
 */
router.get(
  '/previous-month',
  validateRequest({ query: reportQuerySchema }),
  reportController.getMonthlyReport.bind(reportController)
);

export const reportRoutes = router;
