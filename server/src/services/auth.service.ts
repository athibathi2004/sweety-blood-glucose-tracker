import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthenticatedUser, JwtTokenPayload, AuthSuccessResult } from '../types/auth';

export const AUTH_COOKIE_NAME = 'sweety_token';

/**
 * Generates uniform secure cookie options for session management
 */
export function getAuthCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}

export class AuthService {
  /**
   * Generates a signed JWT embedding userId, email, and current tokenVersion
   */
  public generateToken(payload: JwtTokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  /**
   * Cryptographically verifies JWT token and extracts payload
   */
  public verifyToken(token: string): JwtTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
      if (!decoded.userId || decoded.tokenVersion === undefined) {
        throw new AppError('Malformed token payload', 401, 'INVALID_TOKEN');
      }
      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
      }
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Registers a new user account with hashed password
   */
  public async register(input: RegisterInput): Promise<AuthSuccessResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    // Hash password with configured salt rounds
    const hashedPassword = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        tokenVersion: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: authenticatedUser, token };
  }

  /**
   * Authenticates user using email and password
   */
  public async login(input: LoginInput): Promise<AuthSuccessResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Generic error to prevent user enumeration
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: authenticatedUser, token };
  }

  /**
   * Invalidates active sessions by incrementing the tokenVersion on the user record
   */
  public async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });
  }

  /**
   * Retrieves user profile by ID without password hash
   */
  public async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}

export const authService = new AuthService();
