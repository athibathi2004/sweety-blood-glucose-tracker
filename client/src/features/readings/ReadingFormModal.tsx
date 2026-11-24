import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, Activity, Check } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { readingApi, CreateReadingDto } from '@/services/readingApi';
import { Reading, TimeSlot } from '@/types';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const readingSchema = z.object({
  readingDate: z
    .string({ required_error: 'Please select a date.' })
    .min(1, 'Please select a date.')
    .refine((val) => val <= getTodayString(), {
      message: 'Date cannot be in the future.',
    }),
  timeSlot: z.enum(['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'], {
    errorMap: () => ({ message: 'Please select a time slot.' }),
  }),
  glucoseValue: z
    .coerce
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

type ReadingFormData = z.infer<typeof readingSchema>;

interface ReadingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReading?: Reading | null;
}

const SLOT_OPTIONS: { id: TimeSlot; label: string; subtext: string }[] = [
  { id: 'MORNING', label: 'Morning (fasting)', subtext: 'Before breakfast' },
  { id: 'AFTER_BREAKFAST', label: 'After breakfast', subtext: '2 hrs post-meal' },
  { id: 'AFTER_LUNCH', label: 'After lunch', subtext: '2 hrs post-meal' },
  { id: 'AFTER_DINNER', label: 'After dinner', subtext: '2 hrs post-meal' },
];

export const ReadingFormModal: React.FC<ReadingFormModalProps> = ({
  isOpen,
  onClose,
  initialReading,
}) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = Boolean(initialReading);
  const today = getTodayString();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      readingDate: today,
      timeSlot: 'MORNING',
      glucoseValue: 100,
    },
  });

  const selectedSlot = watch('timeSlot');

  useEffect(() => {
    setServerError(null);
    if (initialReading) {
      reset({
        readingDate: initialReading.readingDate,
        timeSlot: initialReading.timeSlot,
        glucoseValue: initialReading.glucoseValue,
      });
    } else {
      reset({
        readingDate: today,
        timeSlot: 'MORNING',
        glucoseValue: 100,
      });
    }
  }, [initialReading, reset, today, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: ReadingFormData) => {
      const payload: CreateReadingDto = {
        readingDate: data.readingDate,
        timeSlot: data.timeSlot,
        glucoseValue: data.glucoseValue,
      };

      if (isEditing && initialReading) {
        return readingApi.updateReading(initialReading.id, payload);
      }
      return readingApi.createReading(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      onClose();
    },
    onError: (err: Error) => {
      setServerError(err.message);
    },
  });

  const onSubmit = (data: ReadingFormData) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Glucose Reading' : 'Log Glucose Reading'}
      description={
        isEditing
          ? 'Update the recorded date, slot, or blood glucose level.'
          : 'Record a new blood sugar measurement. Maximum 1 entry per time slot, up to 4 per day.'
      }
    >
      {serverError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in-50"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed font-medium">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Date Field */}
        <div className="space-y-1.5">
          <Label htmlFor="reading-date">Measurement Date</Label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <Input
              id="reading-date"
              type="date"
              max={today}
              className="pl-9"
              error={Boolean(errors.readingDate)}
              aria-invalid={Boolean(errors.readingDate)}
              {...register('readingDate')}
            />
          </div>
          {errors.readingDate && (
            <p className="text-destructive text-[11px] font-medium">{errors.readingDate.message}</p>
          )}
        </div>

        {/* Time Slot Selector */}
        <div className="space-y-1.5">
          <Label>Time Slot</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SLOT_OPTIONS.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  type="button"
                  key={slot.id}
                  onClick={() => setValue('timeSlot', slot.id, { shouldValidate: true })}
                  className={`flex flex-col text-left p-2.5 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary shadow-sm font-medium'
                      : 'border-border bg-card text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{slot.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{slot.subtext}</span>
                </button>
              );
            })}
          </div>
          {errors.timeSlot && (
            <p className="text-destructive text-[11px] font-medium">{errors.timeSlot.message}</p>
          )}
        </div>

        {/* Glucose Value Field */}
        <div className="space-y-1.5">
          <Label htmlFor="glucose-value">Blood Glucose Level</Label>
          <div className="relative">
            <Activity className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <Input
              id="glucose-value"
              type="number"
              step="1"
              min="40"
              max="600"
              placeholder="e.g. 105"
              className="pl-9 pr-16"
              error={Boolean(errors.glucoseValue)}
              aria-invalid={Boolean(errors.glucoseValue)}
              {...register('glucoseValue')}
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-medium pointer-events-none">
              mg/dl
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Permitted range: 40 - 600 mg/dl</span>
            <span className="text-muted-foreground/70">Whole numbers only</span>
          </div>
          {errors.glucoseValue && (
            <p className="text-destructive text-[11px] font-medium">{errors.glucoseValue.message}</p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.isPending} className="min-w-[120px]">
            {mutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Save Reading'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
