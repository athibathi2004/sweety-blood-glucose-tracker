import { Request, Response, NextFunction } from 'express';
import { authService, AUTH_COOKIE_NAME, getAuthCookieOptions } from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.register(req.body);

      // Set secure HttpOnly cookie
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(201).json(
        successResponse({ user }, 'User account registered successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.login(req.body);

      // Set secure HttpOnly cookie
      res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

      res.status(200).json(
        successResponse({ user }, 'Logged in successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        // Invalidate all active sessions for this user on the server
        await authService.logout(req.user.id);
      }

      // Clear the authentication cookie with identical options
      const cookieOptions = getAuthCookieOptions();
      res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      });

      res.status(200).json(
        successResponse(null, 'Logged out successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is guaranteed by requireAuth middleware
      res.status(200).json(
        successResponse({ user: req.user }, 'Current user profile retrieved')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
