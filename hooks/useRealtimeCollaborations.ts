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

  const handleNewCollaboration = useCallback(async (payload: { new: { note_id: string } }) => {
    // Fetch additional information about the collaboration
    try {
      const noteId = payload.new.note_id;
      const response = await fetch(`/api/notes/${noteId}`);
      if (response.ok) {
        const { note } = await response.json();
        const noteTitle = note?.title || 'a note';
        
        // Show notification
        toast.success(`A note "${noteTitle}" was shared with you`, {
          duration: 5000,
        });
      }
    } catch {
      // Fallback notification
      toast.success(`A new note was shared with you`, {
        duration: 5000,
      });
    }

    // Invalidate notes query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders-with-notes'] });
    
    // Trigger a refresh event for the sidebar
    window.dispatchEvent(new Event('refresh-notes'));
    
    // Call the callback if provided
    if (onNewCollaboration) {
      onNewCollaboration();
    }
  }, [queryClient, onNewCollaboration]);

  const handlePublicShareUpdate = useCallback(() => {
    // When a note becomes publicly shared, refresh the notes list
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders-with-notes'] });
    
    // Trigger a refresh event for the sidebar
    window.dispatchEvent(new Event('refresh-notes'));
    
    // Call the callback if provided
    if (onNewCollaboration) {
      onNewCollaboration();
    }
  }, [queryClient, onNewCollaboration]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new collaborations for the current user
    const collaborationsChannel = supabase
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
      .subscribe();

    // Also subscribe to public-access collaborations (shared links)
    // This will help detect when notes are shared publicly
    const publicShareChannel = supabase
      .channel(`public-shares`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collaborators',
          filter: `user_id=eq.public-access`,
        },
        handlePublicShareUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'collaborators',
          filter: `user_id=eq.public-access`,
        },
        handlePublicShareUpdate
      )
      .subscribe();

    // Subscribe to note updates to detect when notes are shared
    const notesChannel = supabase
      .channel(`notes-updates:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
        },
        () => {
          // When any note is updated, refresh the list
          // This helps catch when notes are shared/unshared
          handlePublicShareUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(collaborationsChannel);
      supabase.removeChannel(publicShareChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [user?.id, supabase, handleNewCollaboration, handlePublicShareUpdate]);

  return null;
}