'use client';

import { useRealtimeCollaborations } from '@/hooks/useRealtimeCollaborations';
import { useCallback } from 'react';

export function RealtimeCollaborationsProvider({ children }: { children: React.ReactNode }) {
  // When a new collaboration is detected, trigger a refresh
  const handleNewCollaboration = useCallback(() => {
    // Dispatch a custom event that the sidebar can listen to
    window.dispatchEvent(new Event('refresh-notes'));
  }, []);

  useRealtimeCollaborations(handleNewCollaboration);
  
  return <>{children}</>;
}