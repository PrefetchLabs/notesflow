import { useState, useEffect, useCallback, useRef } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useTimeBlocksSync } from './useTimeBlocksSync';
import { useSession } from '@/lib/auth/auth-client';

export interface TimeBlock {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  icon?: string;
  isCompleted: boolean;
  noteId?: string | null;
  type?: 'event' | 'task';
}

interface CreateTimeBlockInput {
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  icon?: string;
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

export function useTimeBlocks(currentWeek: Date, isInteracting = false) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const lastFetchRef = useRef<string>('');

  // Fetch time blocks for the current week
  const fetchBlocks = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
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

      // Only update if data has changed
      const newDataString = JSON.stringify(blocksData);
      if (newDataString !== lastFetchRef.current) {
        lastFetchRef.current = newDataString;
        setBlocks(blocksData);
      }
    } catch (error) {
      // [REMOVED_CONSOLE]
      setError('Failed to load time blocks');
      // Only show error toast on initial load
      if (showLoading) {
        toast.error('Failed to load time blocks');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Background sync when not interacting
  const syncBlocks = useCallback(() => {
    if (!isInteracting) {
      fetchBlocks(false); // Don't show loading indicator for background sync
    }
  }, [fetchBlocks, isInteracting]);

  // Enable sync when user is logged in and not interacting
  useTimeBlocksSync({
    isEnabled: !!session?.user && !isInteracting,
    onSync: syncBlocks,
    interval: 3000, // Sync every 3 seconds
  });

  // Create a new time block
  const createBlock = useCallback(
    async (input: CreateTimeBlockInput) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticBlock: TimeBlock = {
        id: tempId,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        color: input.color || '#3B82F6',
        icon: input.icon,
        isCompleted: false,
        noteId: input.noteId,
        type: input.type || 'event',
      };

      // Optimistically add the block
      setBlocks((prev) => [...prev, optimisticBlock]);

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
            icon: input.icon,
            noteId: input.noteId,
            type: input.type,
          }),
        });

        if (!response.ok) throw new Error('Failed to create time block');

        const { block } = await response.json();
        const newBlock = {
          ...block,
          startTime: new Date(block.startTime),
          endTime: new Date(block.endTime),
        };

        // Replace optimistic block with real one
        setBlocks((prev) => 
          prev.map((b) => (b.id === tempId ? newBlock : b))
        );
        
        // Update lastFetchRef to prevent sync from overwriting
        lastFetchRef.current = JSON.stringify(
          blocks.map((b) => (b.id === tempId ? newBlock : b))
        );
        
        toast.success('Time block created');
        
        return newBlock;
      } catch (error) {
        // Remove optimistic block on error
        setBlocks((prev) => prev.filter((b) => b.id !== tempId));
        // [REMOVED_CONSOLE]
        toast.error('Failed to create time block');
        throw error;
      }
    },
    [blocks]
  );

  // Update a time block
  const updateBlock = useCallback(
    async (id: string, updates: UpdateTimeBlockInput) => {
      // Store original block for rollback
      const originalBlock = blocks.find((b) => b.id === id);
      if (!originalBlock) return;

      // Optimistically update
      const optimisticBlock = {
        ...originalBlock,
        ...updates,
        startTime: updates.startTime || originalBlock.startTime,
        endTime: updates.endTime || originalBlock.endTime,
      };
      
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? optimisticBlock : b))
      );

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
        
        // Update lastFetchRef to prevent sync from overwriting
        lastFetchRef.current = JSON.stringify(
          blocks.map((b) => (b.id === id ? updatedBlock : b))
        );

        if (updates.isCompleted !== undefined) {
          toast.success(updates.isCompleted ? 'Task completed!' : 'Task marked as incomplete');
        }
      } catch (error) {
        // Rollback on error
        setBlocks((prev) =>
          prev.map((b) => (b.id === id ? originalBlock : b))
        );
        // [REMOVED_CONSOLE]
        toast.error('Failed to update time block');
        throw error;
      }
    },
    [blocks]
  );

  // Delete a time block
  const deleteBlock = useCallback(async (id: string) => {
    // Store original block for rollback
    const originalBlock = blocks.find((b) => b.id === id);
    if (!originalBlock) return;

    // Optimistically delete
    setBlocks((prev) => prev.filter((b) => b.id !== id));

    try {
      const response = await fetch(`/api/time-blocks/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) throw new Error('Failed to delete time block');

      // Update lastFetchRef to prevent sync from overwriting
      lastFetchRef.current = JSON.stringify(
        blocks.filter((b) => b.id !== id)
      );
      
      toast.success('Time block deleted');
    } catch (error) {
      // Rollback on error
      setBlocks((prev) => [...prev, originalBlock]);
      // [REMOVED_CONSOLE]
      toast.error('Failed to delete time block');
      throw error;
    }
  }, [blocks]);

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