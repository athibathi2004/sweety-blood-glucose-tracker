import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { readingApi } from '@/services/readingApi';
import { Reading } from '@/types';
import { TIME_SLOT_LABELS } from '@/types/readingConstants';

interface DeleteReadingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reading: Reading | null;
}

export const DeleteReadingDialog: React.FC<DeleteReadingDialogProps> = ({
  isOpen,
  onClose,
  reading,
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return readingApi.deleteReading(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      onClose();
    },
  });

  if (!reading) return null;

  const slotLabel = TIME_SLOT_LABELS[reading.timeSlot] || reading.timeSlot;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Glucose Reading"
      description="This action cannot be undone."
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-destructive" />
          <p className="leading-relaxed">
            Are you sure you want to permanently delete the <strong className="font-semibold">{slotLabel}</strong> reading
            of <strong className="font-semibold">{reading.glucoseValue} mg/dl</strong> recorded on{' '}
            <strong className="font-semibold">{reading.readingDate}</strong>?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(reading.id)}
            className="min-w-[100px]"
          >
            {mutation.isPending ? 'Deleting...' : 'Delete Reading'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
