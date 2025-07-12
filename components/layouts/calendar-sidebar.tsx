'use client';

import { useState } from 'react';
import { MinimalCalendar } from '@/components/calendar/minimal-calendar';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { TimeBlock } from '@/components/calendar/time-block';
import { toast } from 'sonner';

interface CalendarSidebarProps {
  onToggle: () => void;
}

export function CalendarSidebar({ onToggle }: CalendarSidebarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { blocks, isLoading, error, createBlock, updateBlock, deleteBlock } = useTimeBlocks(currentDate);

  // Handle creating events from the calendar
  const handleCreateEvent = async (startTime: Date, endTime: Date) => {
    try {
      await createBlock({
        title: 'New Event',
        startTime,
        endTime,
        color: '#3B82F6', // Blue for events
      });
      toast.success('Event created');
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  // Handle creating tasks from the calendar
  const handleCreateTask = async (startTime: Date, endTime: Date) => {
    try {
      await createBlock({
        title: 'New Task',
        startTime,
        endTime,
        color: '#10B981', // Green for tasks
      });
      toast.success('Task created');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // Handle updating block times
  const handleUpdateBlock = async (id: string, startTime: Date, endTime: Date) => {
    try {
      await updateBlock(id, { startTime, endTime });
      toast.success('Time updated');
    } catch (error) {
      toast.error('Failed to update time');
    }
  };

  return (
    <aside className="calendar-sidebar relative w-[280px] h-full bg-background border-l">
      <MinimalCalendar 
        currentDate={currentDate} 
        onDateChange={setCurrentDate}
        onCreateEvent={handleCreateEvent}
        onCreateTask={handleCreateTask}
        onUpdateBlock={handleUpdateBlock}
        blocks={blocks}
      />
    </aside>
  );
}