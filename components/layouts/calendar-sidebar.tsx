'use client';

import { useState } from 'react';
import { MinimalCalendar } from '@/components/calendar/minimal-calendar';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { TimeBlock } from '@/components/calendar/time-block';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';

interface CalendarSidebarProps {
  onToggle: () => void;
}

export function CalendarSidebar({ onToggle }: CalendarSidebarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isInteracting, setIsInteracting] = useState(false);
  const { blocks, isLoading, error, createBlock, updateBlock, deleteBlock } = useTimeBlocks(currentDate, isInteracting);
  const { user } = useAuth();


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
    <aside className="calendar-sidebar relative w-[280px] h-full bg-background border-l overflow-hidden">
      <MinimalCalendar 
        currentDate={currentDate} 
        onDateChange={setCurrentDate}
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
    </aside>
  );
}