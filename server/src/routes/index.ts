import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { readingRoutes } from './reading.routes';
import { reportRoutes } from './report.routes';

const router = Router();

// API Health Check
router.use('/health', healthRoutes);

// Authentication & User Management
router.use('/auth', authRoutes);

// Blood Glucose Reading Management
router.use('/readings', readingRoutes);

// Glucose Analytics & Reporting
router.use('/reports', reportRoutes);

export const apiRouter = router;
