export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtTokenPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export interface AuthSuccessResult {
  user: AuthenticatedUser;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
