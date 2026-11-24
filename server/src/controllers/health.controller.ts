import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';
import { successResponse } from '../utils/apiResponse';

export class HealthController {
  public async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await healthService.getHealth();
      res.status(200).json(successResponse(healthData, 'Sweety API is healthy'));
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
