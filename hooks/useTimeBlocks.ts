import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  isCompleted: boolean;
  noteId?: string | null;
  type?: 'event' | 'task';
}

interface CreateTimeBlockInput {
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  noteId?: string | null;
  type?: 'event' | 'task';
}

interface UpdateTimeBlockInput {
  startTime?: Date;
  endTime?: Date;
  isCompleted?: boolean;
  title?: string;
  color?: string;
  type?: 'event' | 'task';
}

export function useTimeBlocks(currentWeek: Date) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch time blocks for the current week
  const fetchBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

      const response = await fetch(
        `/api/time-blocks?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`,
        { credentials: 'same-origin' }
      );

      if (!response.ok) throw new Error('Failed to fetch time blocks');

      const data = await response.json();
      const blocksData = data.blocks.map((block: any) => ({
        ...block,
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
      }));

      setBlocks(blocksData);
    } catch (error) {
      console.error('Error fetching time blocks:', error);
      setError('Failed to load time blocks');
      toast.error('Failed to load time blocks');
    } finally {
      setIsLoading(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Create a new time block
  const createBlock = useCallback(
    async (input: CreateTimeBlockInput) => {
      try {
        const response = await fetch('/api/time-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            title: input.title,
            startTime: input.startTime.toISOString(),
            endTime: input.endTime.toISOString(),
            color: input.color,
            noteId: input.noteId,
          }),
        });

        if (!response.ok) throw new Error('Failed to create time block');

        const { block } = await response.json();
        const newBlock = {
          ...block,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        };

        setBlocks((prev) => [...prev, newBlock]);
        toast.success('Time block created');
        
        return newBlock;
      } catch (error) {
        console.error('Error creating time block:', error);
        toast.error('Failed to create time block');
        throw error;
      }
    },
    []
  );

  // Update a time block
  const updateBlock = useCallback(
    async (id: string, updates: UpdateTimeBlockInput) => {
      try {
        const response = await fetch(`/api/time-blocks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            ...updates,
            startTime: updates.startTime?.toISOString(),
            endTime: updates.endTime?.toISOString(),
          }),
        });

        if (!response.ok) throw new Error('Failed to update time block');

        const { block } = await response.json();
        const updatedBlock = {
          ...block,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        };

        setBlocks((prev) =>
          prev.map((b) => (b.id === id ? updatedBlock : b))
        );

        if (updates.isCompleted !== undefined) {
          toast.success(updates.isCompleted ? 'Task completed!' : 'Task marked as incomplete');
        }
      } catch (error) {
        console.error('Error updating time block:', error);
        toast.error('Failed to update time block');
        throw error;
      }
    },
    []
  );

  // Delete a time block
  const deleteBlock = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/time-blocks/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) throw new Error('Failed to delete time block');

      setBlocks((prev) => prev.filter((b) => b.id !== id));
      toast.success('Time block deleted');
    } catch (error) {
      console.error('Error deleting time block:', error);
      toast.error('Failed to delete time block');
      throw error;
    }
  }, []);

  return {
    blocks,
    isLoading,
    error,
    createBlock,
    updateBlock,
    deleteBlock,
    refetch: fetchBlocks,
  };
}