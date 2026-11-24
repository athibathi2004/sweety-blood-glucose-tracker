import { z } from 'zod';
import { TIME_SLOTS, TimeSlot } from '../types/reading';
import { isValidDateOnlyString, isValidMonthString, isFutureDate } from '../utils/date';

/**
 * Returns the exact friendly duplicate slot error message specified in assignment requirements.
 */
export function getSlotDuplicateMessage(slot: TimeSlot | string): string {
  switch (slot) {
    case 'MORNING':
      return 'You already have a Morning reading for this date.';
    case 'AFTER_BREAKFAST':
      return 'You already have an After breakfast reading for this date.';
    case 'AFTER_LUNCH':
      return 'You already have an After lunch reading for this date.';
    case 'AFTER_DINNER':
      return 'You already have an After dinner reading for this date.';
    default:
      return 'You already have a reading for this time slot on this date.';
  }
}

export const createReadingSchema = z.object({
  readingDate: z
    .string({ required_error: 'Reading date is required' })
    .refine((val) => isValidDateOnlyString(val), {
      message: 'Please provide a valid calendar date in YYYY-MM-DD format.',
    })
    .refine((val) => !isFutureDate(val), {
      message: 'Date cannot be in the future.',
    }),

  timeSlot: z.enum(TIME_SLOTS as [TimeSlot, ...TimeSlot[]], {
    errorMap: () => ({
      message: 'Invalid time slot. Permitted values are MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER.',
    }),
  }),

  glucoseValue: z
    .number({
      required_error: 'Please enter a glucose value.',
      invalid_type_error: 'Please enter a glucose value.',
    })
    .refine((val) => Number.isInteger(val), {
      message: 'Glucose value must be a whole number.',
    })
    .refine((val) => val >= 40 && val <= 600, {
      message: 'Value must be between 40 and 600 mg/dl.',
    }),
});

export const updateReadingSchema = z
  .object({
    readingDate: z
      .string()
      .refine((val) => isValidDateOnlyString(val), {
        message: 'Please provide a valid calendar date in YYYY-MM-DD format.',
      })
      .refine((val) => !isFutureDate(val), {
        message: 'Date cannot be in the future.',
      })
      .optional(),

    timeSlot: z
      .enum(TIME_SLOTS as [TimeSlot, ...TimeSlot[]], {
        errorMap: () => ({
          message: 'Invalid time slot. Permitted values are MORNING, AFTER_BREAKFAST, AFTER_LUNCH, AFTER_DINNER.',
        }),
      })
      .optional(),

    glucoseValue: z
      .number({
        invalid_type_error: 'Please enter a glucose value.',
      })
      .refine((val) => Number.isInteger(val), {
        message: 'Glucose value must be a whole number.',
      })
      .refine((val) => val >= 40 && val <= 600, {
        message: 'Value must be between 40 and 600 mg/dl.',
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.readingDate !== undefined ||
      data.timeSlot !== undefined ||
      data.glucoseValue !== undefined,
    {
      message: 'At least one field (readingDate, timeSlot, or glucoseValue) must be provided for update.',
    }
  );

export const readingFilterSchema = z.object({
  date: z
    .string()
    .refine((val) => isValidDateOnlyString(val), {
      message: 'Date filter must be in YYYY-MM-DD format.',
    })
    .optional(),

  month: z
    .string()
    .refine((val) => isValidMonthString(val), {
      message: 'Month filter must be in YYYY-MM format.',
    })
    .optional(),

  timeSlot: z
    .enum(TIME_SLOTS as [TimeSlot, ...TimeSlot[]], {
      errorMap: () => ({
        message: 'Invalid time slot filter.',
      }),
    })
    .optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type ReadingFilterInput = z.infer<typeof readingFilterSchema>;
