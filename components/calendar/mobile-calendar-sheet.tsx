'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { MinimalCalendar } from '@/components/calendar/minimal-calendar';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';

interface MobileCalendarSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileCalendarSheet({ isOpen, onOpenChange }: MobileCalendarSheetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isInteracting, setIsInteracting] = useState(false);
  const { blocks, isLoading, error, createBlock, updateBlock, deleteBlock } = useTimeBlocks(currentDate, isInteracting);
  const { user } = useAuth();

  // Handle creating events from the calendar
  const handleCreateEvent = async (startTime: Date, endTime: Date) => {
    try {
      await createBlock({
        title: 'New Event',
        startTime,
        endTime,
        color: '#3B82F6', // Blue for events
        type: 'event',
      });
      toast.success('Event created');
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  // Handle creating tasks from the calendar
  const handleCreateTask = async (startTime: Date, endTime: Date, title?: string, color?: string, icon?: string) => {
    try {
      await createBlock({
        title: title || 'New Task',
        startTime,
        endTime,
        color: color || '#10B981', // Green for tasks by default
        icon: icon || null,
        type: 'task',
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

  // Handle updating block color
  const handleUpdateColor = async (id: string, color: string) => {
    try {
      await updateBlock(id, { color });
      toast.success('Color updated');
    } catch (error) {
      toast.error('Failed to update color');
    }
  };

  // Handle deleting blocks
  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlock(id);
      toast.success('Block deleted');
    } catch (error) {
      toast.error('Failed to delete block');
    }
  };

  // Handle toggling task completion
  const handleToggleComplete = async (id: string) => {
    try {
      const block = blocks.find(b => b.id === id);
      if (!block) {
        // [REMOVED_CONSOLE]
        return;
      }
      await updateBlock(id, { isCompleted: !block.isCompleted });
      toast.success(block.isCompleted ? 'Task marked as incomplete' : 'Task marked as complete');
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to update task');
    }
  };

  // Handle renaming blocks
  const handleRenameBlock = async (id: string, newTitle: string) => {
    try {
      await updateBlock(id, { title: newTitle });
      toast.success('Title updated');
    } catch (error) {
      toast.error('Failed to update title');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Calendar</SheetTitle>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-57px)] overflow-hidden">
          <MinimalCalendar 
            currentDate={currentDate} 
            onDateChange={setCurrentDate}
            onCreateEvent={handleCreateEvent}
            onCreateTask={handleCreateTask}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onToggleComplete={handleToggleComplete}
            onRenameBlock={handleRenameBlock}
            onUpdateColor={handleUpdateColor}
            blocks={blocks}
            onInteractionStart={() => setIsInteracting(true)}
            onInteractionEnd={() => setIsInteracting(false)}
            userEmail={user?.email}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}