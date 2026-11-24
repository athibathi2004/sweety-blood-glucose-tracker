import { Request, Response, NextFunction } from 'express';
import { authService, AUTH_COOKIE_NAME } from '../services/auth.service';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract token from HttpOnly cookie or Authorization header fallback
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED');
    }

    // 2. Cryptographic signature and expiry verification
    const payload = authService.verifyToken(token);

    // 3. Database session invalidation check via tokenVersion
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User session is invalid. Account does not exist.', 401, 'USER_NOT_FOUND');
    }

    // Invalidation check: if user logged out or invalidated sessions, tokenVersion was incremented
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new AppError('Session has expired or was revoked. Please log in again.', 401, 'SESSION_REVOKED');
    }

    // 4. Attach authenticated user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    next(error);
  }
}
