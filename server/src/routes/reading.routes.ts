import { Router } from 'express';
import { readingController } from '../controllers/reading.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate';
import {
  createReadingSchema,
  updateReadingSchema,
  readingFilterSchema,
} from '../validators/reading.validator';

const router = Router();

// All reading endpoints require user authentication
router.use(requireAuth);

// POST /api/readings
router.post(
  '/',
  validateRequest({ body: createReadingSchema }),
  (req, res, next) => readingController.create(req, res, next)
);

// GET /api/readings
router.get(
  '/',
  validateRequest({ query: readingFilterSchema }),
  (req, res, next) => readingController.list(req, res, next)
);

// GET /api/readings/:id
router.get('/:id', (req, res, next) => readingController.getById(req, res, next));

// PUT /api/readings/:id
router.put(
  '/:id',
  validateRequest({ body: updateReadingSchema }),
  (req, res, next) => readingController.update(req, res, next)
);

// DELETE /api/readings/:id
router.delete('/:id', (req, res, next) => readingController.delete(req, res, next));

export const readingRoutes = router;
