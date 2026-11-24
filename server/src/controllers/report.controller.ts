import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';

export class ReportController {
  /**
   * GET /api/reports/daily?date=YYYY-MM-DD
   */
  public async getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const date = req.query.date as string;
      const report = await reportService.getDailyReport(req.user.id, date);

      res.status(200).json(
        successResponse({ ...report, report }, 'Daily report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/month-to-date?date=YYYY-MM-DD
   */
  public async getMonthToDateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const date = req.query.date as string;
      const report = await reportService.getMonthToDateReport(req.user.id, date);

      res.status(200).json(
        successResponse({ ...report, report }, 'Month-to-date report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/monthly?date=YYYY-MM-DD
   * (Previous-month report covering entire preceding calendar month)
   */
  public async getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const date = req.query.date as string;
      const report = await reportService.getPreviousMonthReport(req.user.id, date);

      res.status(200).json(
        successResponse({ ...report, report }, 'Previous month report generated successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
