import { Request, Response } from 'express';
import { errorResponse } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`)
  );
}
