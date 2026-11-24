import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/apiResponse';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handler
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json(
      errorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))
      )
    );
    return;
  }

  // 2. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`Prisma error code [${err.code}]: ${err.message}`);

    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json(
        errorResponse('DUPLICATE_ENTRY', `A record with this ${target} already exists.`)
      );
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json(
        errorResponse('RECORD_NOT_FOUND', 'Requested record was not found.')
      );
      return;
    }

    res.status(400).json(
      errorResponse('DATABASE_ERROR', 'A database constraint violation occurred.')
    );
    return;
  }

  // 3. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details)
    );
    return;
  }

  // 4. Fallback: Unexpected internal errors
  const isProd = env.NODE_ENV === 'production';
  const errorMessage = err instanceof Error ? err.message : 'Unknown internal error';
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error('Unhandled internal error:', errorMessage, stack);

  res.status(500).json(
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      isProd ? 'An unexpected internal server error occurred.' : errorMessage,
      isProd ? undefined : { stack }
    )
  );
}
