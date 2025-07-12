import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { TimeBlock } from './useTimeBlocks';

interface UseRealtimeTimeBlocksProps {
  userId: string;
  onInsert?: (block: TimeBlock) => void;
  onUpdate?: (block: TimeBlock) => void;
  onDelete?: (blockId: string) => void;
  isInteracting?: boolean;
}

export function useRealtimeTimeBlocks({
  userId,
  onInsert,
  onUpdate,
  onDelete,
  isInteracting = false,
}: UseRealtimeTimeBlocksProps) {
  const supabase = createClient();
  const pendingUpdatesRef = useRef<Array<{
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: any;
  }>>([]);

  // Process a real-time change
  const processChange = (payload: RealtimePostgresChangesPayload<any>) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      const newBlock: TimeBlock = {
        ...payload.new,
        startTime: new Date(payload.new.startTime),
        endTime: new Date(payload.new.endTime),
      };
      onInsert?.(newBlock);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedBlock: TimeBlock = {
        ...payload.new,
        startTime: new Date(payload.new.startTime),
        endTime: new Date(payload.new.endTime),
      };
      onUpdate?.(updatedBlock);
    } else if (payload.eventType === 'DELETE' && payload.old) {
      onDelete?.(payload.old.id);
    }
  };

  // Handle real-time update
  const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<any>) => {
    // Skip if this change is from the current user's action (handled optimistically)
    if (payload.new?.updatedAt && Date.now() - new Date(payload.new.updatedAt).getTime() < 1000) {
      return;
    }

    if (isInteracting) {
      // Queue the update for later
      pendingUpdatesRef.current.push({
        type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        payload,
      });
    } else {
      // Process immediately
      processChange(payload);
    }
  };

  // Process pending updates when interaction ends
  useEffect(() => {
    if (!isInteracting && pendingUpdatesRef.current.length > 0) {
      const updates = [...pendingUpdatesRef.current];
      pendingUpdatesRef.current = [];
      
      // Process all pending updates
      updates.forEach(({ payload }) => {
        processChange(payload);
      });
    }
  }, [isInteracting]);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`time-blocks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_blocks',
          filter: `user_id=eq.${userId}`,
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isInteracting]);
}