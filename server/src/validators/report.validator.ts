import { z } from 'zod';
import { isValidDateOnlyString, isFutureDate } from '../utils/date';

export const reportQuerySchema = z.object({
  date: z
    .string({ required_error: 'Date query parameter is required.' })
    .min(1, 'Date query parameter is required.')
    .refine((val) => isValidDateOnlyString(val), {
      message: 'Invalid date format. Expected YYYY-MM-DD calendar date.',
    })
    .refine((val) => !isFutureDate(val), {
      message: 'Date cannot be in the future.',
    }),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
