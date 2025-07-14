'use client';

import { useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-hooks';

export function useRealtimeCollaborations(onNewCollaboration?: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // [REMOVED_CONSOLE]
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleNewCollaboration = useCallback((payload: any) => {
    // Show notification
    const inviterName = payload.new.inviter_name || 'Someone';
    const noteTitle = payload.new.note_title || 'a note';
    
    toast.success(`${inviterName} shared "${noteTitle}" with you`, {
      duration: 5000,
    });

    // Invalidate notes query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders-with-notes'] });
    
    // Call the callback if provided
    if (onNewCollaboration) {
      onNewCollaboration();
    }
  }, [queryClient, onNewCollaboration]);
  
  const handleRemovedCollaboration = useCallback((payload: any) => {
    // Show notification
    const noteTitle = payload.old.note_title || 'a note';
    
    toast.info(`You no longer have access to "${noteTitle}"`, {
      duration: 5000,
    });

    // Invalidate notes query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders-with-notes'] });
    
    // If user is currently viewing the removed note, redirect them
    if (window.location.pathname.includes(`/notes/${payload.old.note_id}`)) {
      window.location.href = '/dashboard';
    }
  }, [queryClient]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to collaboration changes for the current user
    const channel = supabase
      .channel(`collaborations:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaborators',
          filter: `user_id=eq.${user.id}`,
        },
        handleNewCollaboration
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'collaborators',
          filter: `user_id=eq.${user.id}`,
        },
        handleRemovedCollaboration
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, handleNewCollaboration, handleRemovedCollaboration]);

  return null;
}