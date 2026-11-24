export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiResponse<never> {
  return {
    success: false,
    message,
    error: {
      code,
      ...(details ? { details } : {}),
    },
  };
}
