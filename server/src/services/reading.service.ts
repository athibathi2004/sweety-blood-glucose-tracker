import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateReadingInput,
  UpdateReadingInput,
  ReadingFilterInput,
  getSlotDuplicateMessage,
} from '../validators/reading.validator';
import { ReadingResponse, TIME_SLOT_ORDER, TimeSlot } from '../types/reading';
import { parseDateOnly, formatDateOnly, getMonthDateRange } from '../utils/date';

export class ReadingService {
  /**
   * Serializes a Prisma reading entity into the canonical API contract
   */
  private serializeReading(reading: {
    id: string;
    userId: string;
    readingDate: Date;
    timeSlot: string;
    glucoseValue: number;
    createdAt: Date;
    updatedAt: Date;
  }): ReadingResponse {
    return {
      id: reading.id,
      userId: reading.userId,
      readingDate: formatDateOnly(reading.readingDate),
      timeSlot: reading.timeSlot as TimeSlot,
      glucoseValue: reading.glucoseValue,
      createdAt: reading.createdAt.toISOString(),
      updatedAt: reading.updatedAt.toISOString(),
    };
  }

  /**
   * Creates a new glucose reading with business validation and constraint enforcement
   */
  public async createReading(userId: string, input: CreateReadingInput): Promise<ReadingResponse> {
    const parsedDate = parseDateOnly(input.readingDate);

    // 1. Business Check: Enforce maximum four readings per day per user
    const existingForDay = await prisma.reading.findMany({
      where: {
        userId,
        readingDate: parsedDate,
      },
    });

    if (existingForDay.length >= 4) {
      throw new AppError('You can add only 4 readings per day.', 409, 'DAILY_LIMIT_EXCEEDED');
    }

    // 2. Business Check: Enforce one reading per slot per day
    const duplicate = existingForDay.find((r) => r.timeSlot === input.timeSlot);
    if (duplicate) {
      throw new AppError(getSlotDuplicateMessage(input.timeSlot), 409, 'DUPLICATE_TIME_SLOT');
    }

    try {
      // 3. Persist with database-level composite unique constraint backup
      const reading = await prisma.reading.create({
        data: {
          userId,
          readingDate: parsedDate,
          timeSlot: input.timeSlot,
          glucoseValue: input.glucoseValue,
        },
      });

      return this.serializeReading(reading);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError(getSlotDuplicateMessage(input.timeSlot), 409, 'DUPLICATE_TIME_SLOT');
      }
      throw err;
    }
  }

  /**
   * Lists readings for the authenticated user with optional date, month, and slot filters
   */
  public async listReadings(userId: string, filters: ReadingFilterInput): Promise<ReadingResponse[]> {
    const whereClause: Prisma.ReadingWhereInput = {
      userId,
    };

    if (filters.date) {
      whereClause.readingDate = parseDateOnly(filters.date);
    } else if (filters.month) {
      const { startDate, endDate } = getMonthDateRange(filters.month);
      whereClause.readingDate = {
        gte: parseDateOnly(startDate),
        lte: parseDateOnly(endDate),
      };
    }

    if (filters.timeSlot) {
      whereClause.timeSlot = filters.timeSlot;
    }

    const readings = await prisma.reading.findMany({
      where: whereClause,
      orderBy: [
        { readingDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Consistent secondary sort by chronological meal slot order per calendar day:
    // MORNING (1) -> AFTER_BREAKFAST (2) -> AFTER_LUNCH (3) -> AFTER_DINNER (4)
    readings.sort((a, b) => {
      const dateA = a.readingDate.getTime();
      const dateB = b.readingDate.getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Date descending
      }
      return (
        (TIME_SLOT_ORDER[a.timeSlot as TimeSlot] || 0) -
        (TIME_SLOT_ORDER[b.timeSlot as TimeSlot] || 0)
      );
    });

    return readings.map((r) => this.serializeReading(r));
  }

  /**
   * Retrieves a single reading ensuring strict user ownership
   */
  public async getReadingById(userId: string, readingId: string): Promise<ReadingResponse> {
    const reading = await prisma.reading.findFirst({
      where: {
        id: readingId,
        userId,
      },
    });

    if (!reading) {
      throw new AppError('Reading not found', 404, 'NOT_FOUND');
    }

    return this.serializeReading(reading);
  }

  /**
   * Updates an existing reading ensuring ownership and re-validating business constraints
   */
  public async updateReading(
    userId: string,
    readingId: string,
    input: UpdateReadingInput
  ): Promise<ReadingResponse> {
    const existing = await prisma.reading.findFirst({
      where: {
        id: readingId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Reading not found', 404, 'NOT_FOUND');
    }

    const targetDate = input.readingDate ? parseDateOnly(input.readingDate) : existing.readingDate;
    const targetSlot = input.timeSlot || (existing.timeSlot as TimeSlot);

    const isDateChanging = input.readingDate !== undefined && input.readingDate !== formatDateOnly(existing.readingDate);
    const isSlotChanging = input.timeSlot !== undefined && input.timeSlot !== existing.timeSlot;

    // Check conflict if date or slot changes
    if (isDateChanging || isSlotChanging) {
      const conflicting = await prisma.reading.findFirst({
        where: {
          userId,
          readingDate: targetDate,
          timeSlot: targetSlot,
          NOT: { id: readingId },
        },
      });

      if (conflicting) {
        throw new AppError(getSlotDuplicateMessage(targetSlot), 409, 'DUPLICATE_TIME_SLOT');
      }

      // If moving to another date, enforce 4-reading limit on the target date
      if (isDateChanging) {
        const countOnTarget = await prisma.reading.count({
          where: {
            userId,
            readingDate: targetDate,
            NOT: { id: readingId },
          },
        });

        if (countOnTarget >= 4) {
          throw new AppError('You can add only 4 readings per day.', 409, 'DAILY_LIMIT_EXCEEDED');
        }
      }
    }

    try {
      const updated = await prisma.reading.update({
        where: { id: readingId },
        data: {
          ...(input.readingDate ? { readingDate: targetDate } : {}),
          ...(input.timeSlot ? { timeSlot: targetSlot } : {}),
          ...(input.glucoseValue !== undefined ? { glucoseValue: input.glucoseValue } : {}),
        },
      });

      return this.serializeReading(updated);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError(getSlotDuplicateMessage(targetSlot), 409, 'DUPLICATE_TIME_SLOT');
      }
      throw err;
    }
  }

  /**
   * Deletes a reading ensuring strict user ownership
   */
  public async deleteReading(userId: string, readingId: string): Promise<void> {
    const existing = await prisma.reading.findFirst({
      where: {
        id: readingId,
        userId,
      },
    });

    if (!existing) {
      throw new AppError('Reading not found', 404, 'NOT_FOUND');
    }

    await prisma.reading.delete({
      where: { id: readingId },
    });
  }
}

export const readingService = new ReadingService();
