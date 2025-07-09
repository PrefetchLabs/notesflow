'use client';

import { Calendar, Info } from 'lucide-react';
import { EmptyState } from './empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoTimeBlocksProps {
  date?: Date;
}

export function NoTimeBlocks({ date }: NoTimeBlocksProps) {
  const dateString = date
    ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'this day';

  return (
    <div className="space-y-6 p-8">
      <EmptyState
        icon={Calendar}
        title={`No time blocks for ${dateString}`}
        description="Your schedule is clear! Drag text from any note to this calendar view to create time blocks."
        className="min-h-[300px]"
      />
      
      <Alert className="max-w-2xl mx-auto">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro tip:</strong> Simply select and drag any text from your notes directly onto the calendar to instantly create a time block. The selected text becomes your time block title.
        </AlertDescription>
      </Alert>
    </div>
  );
}