import { Request, Response, NextFunction } from 'express';
import { readingService } from '../services/reading.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

export class ReadingController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const reading = await readingService.createReading(req.user.id, req.body);
      res.status(201).json(successResponse({ reading }, 'Glucose reading recorded successfully'));
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const readings = await readingService.listReadings(req.user.id, req.query);
      res.status(200).json(successResponse({ readings }, 'Glucose readings retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const reading = await readingService.getReadingById(req.user.id, req.params.id!);
      res.status(200).json(successResponse({ reading }, 'Glucose reading retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const reading = await readingService.updateReading(req.user.id, req.params.id!, req.body);
      res.status(200).json(successResponse({ reading }, 'Glucose reading updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      await readingService.deleteReading(req.user.id, req.params.id!);
      res.status(200).json(successResponse(null, 'Glucose reading deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export const readingController = new ReadingController();
