import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Check, Clock, Calendar, Activity } from 'lucide-react';
import { readingApi } from '@/services/readingApi';
import { Reading, TimeSlot } from '@/types';
import { TIME_SLOT_LABELS } from '@/types/readingConstants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ReadingHistory } from './ReadingHistory';
import { ReadingFormModal } from './ReadingFormModal';
import { DeleteReadingDialog } from './DeleteReadingDialog';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ReadingsManagement: React.FC = () => {
  const today = getTodayString();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);

  // Fetch today's readings specifically to compute daily 4-slot progress
  const { data: todayReadings } = useQuery<Reading[]>({
    queryKey: ['readings', { date: today }],
    queryFn: () => readingApi.getReadings({ date: today }),
  });

  const todaySlotsRecorded = new Set(todayReadings?.map((r) => r.timeSlot) || []);
  const todayCount = todaySlotsRecorded.size;

  const handleOpenAdd = () => {
    setEditingReading(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (reading: Reading) => {
    setEditingReading(reading);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (reading: Reading) => {
    setDeletingReading(reading);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Blood Glucose Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record, review, and manage your daily four-slot glucose measurements.
          </p>
        </div>

        <div>
          <Button
            onClick={() => handleOpenAdd()}
            className="w-full sm:w-auto font-medium gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Reading
          </Button>
        </div>
      </div>

      {/* Daily Target & Slots Tracker */}
      <Card className="border-border shadow-sm bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Today&apos;s Daily Progress ({today})
              </CardTitle>
              <CardDescription className="text-xs">
                Each calendar day allows up to four readings (one per meal interval).
              </CardDescription>
            </div>
            <div>
              <Badge
                variant={todayCount === 4 ? 'mint' : 'outline'}
                className="text-xs font-semibold py-1 px-2.5"
              >
                {todayCount} of 4 Recorded
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'] as TimeSlot[]).map(
              (slot) => {
                const isLogged = todaySlotsRecorded.has(slot);
                const matchingReading = todayReadings?.find((r) => r.timeSlot === slot);

                return (
                  <div
                    key={slot}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      isLogged
                        ? 'bg-mint-50/70 border-mint-200 text-mint-900'
                        : 'bg-card border-border/80 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{TIME_SLOT_LABELS[slot].split(' ')[0]}</span>
                      {isLogged ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-mint-500 text-white">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="mt-2 text-[11px]">
                      {isLogged && matchingReading ? (
                        <span className="font-mono font-bold text-mint-800 text-sm">
                          {matchingReading.glucoseValue} <span className="text-[10px] font-normal">mg/dl</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">Pending</span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reading History with Filters & Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground px-1">Reading History</h3>
        <ReadingHistory
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onOpenAddModal={() => handleOpenAdd()}
        />
      </div>

      {/* Modals & Dialogs */}
      <ReadingFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingReading(null);
        }}
        initialReading={editingReading}
      />

      <DeleteReadingDialog
        isOpen={Boolean(deletingReading)}
        onClose={() => setDeletingReading(null)}
        reading={deletingReading}
      />
    </div>
  );
};
