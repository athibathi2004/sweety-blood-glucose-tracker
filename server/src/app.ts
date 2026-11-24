import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. Strict Cross-Origin Resource Sharing (CORS) with credentials enabled
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Cookie Parsing Middleware for HttpOnly authentication tokens
  app.use(cookieParser());

  // 4. Sensible Request Body Size Limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 5. Global Rate Limiting (200 requests per 15 minutes per IP window)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
      error: { code: 'RATE_LIMIT_EXCEEDED' },
    },
    skip: () => process.env.NODE_ENV === 'test',
  });
  app.use('/api', limiter);

  // 6. Mount API Routes
  app.use('/api', apiRouter);

  // 7. 404 Not Found Handler
  app.use(notFoundHandler);

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
