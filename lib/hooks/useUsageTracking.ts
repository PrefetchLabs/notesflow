'use client';

import { useEffect, useCallback } from 'react';
import { useSubscription } from '@/lib/contexts/subscription-context';

interface UsageEvent {
  type: 'note_created' | 'note_deleted' | 'folder_created' | 'folder_deleted' | 
        'ai_request' | 'collaboration_started' | 'share_created';
  metadata?: Record<string, any>;
}

export function useUsageTracking() {
  const { refetchSubscription, checkLimit } = useSubscription();

  const trackEvent = useCallback(async (event: UsageEvent) => {
    try {
      // Log the event for analytics
      // [REMOVED_CONSOLE]

      // Send to analytics endpoint if needed
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: event.type,
          metadata: event.metadata,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Fail silently for analytics
      });

      // Refresh subscription data after certain events
      if (['note_created', 'note_deleted', 'folder_created', 'folder_deleted'].includes(event.type)) {
        await refetchSubscription();
      }
    } catch (error) {
      // [REMOVED_CONSOLE]
    }
  }, [refetchSubscription]);

  const trackNoteCreation = useCallback(() => {
    return trackEvent({ type: 'note_created' });
  }, [trackEvent]);

  const trackNoteDeletion = useCallback(() => {
    return trackEvent({ type: 'note_deleted' });
  }, [trackEvent]);

  const trackFolderCreation = useCallback(() => {
    return trackEvent({ type: 'folder_created' });
  }, [trackEvent]);

  const trackFolderDeletion = useCallback(() => {
    return trackEvent({ type: 'folder_deleted' });
  }, [trackEvent]);

  const trackAIRequest = useCallback((feature: string) => {
    return trackEvent({ 
      type: 'ai_request',
      metadata: { feature }
    });
  }, [trackEvent]);

  const trackCollaborationStart = useCallback((noteId: string) => {
    return trackEvent({ 
      type: 'collaboration_started',
      metadata: { noteId }
    });
  }, [trackEvent]);

  const trackShareCreation = useCallback((noteId: string, shareType: 'public' | 'user') => {
    return trackEvent({ 
      type: 'share_created',
      metadata: { noteId, shareType }
    });
  }, [trackEvent]);

  // Auto-track page views for usage insights
  useEffect(() => {
    const trackPageView = () => {
      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Fail silently
      });
    };

    trackPageView();
  }, []);

  return {
    trackEvent,
    trackNoteCreation,
    trackNoteDeletion,
    trackFolderCreation,
    trackFolderDeletion,
    trackAIRequest,
    trackCollaborationStart,
    trackShareCreation,
    checkLimit,
  };
}

// Hook for monitoring resource usage in real-time
export function useResourceMonitor() {
  const { usage, limits, isFreeTier } = useSubscription();

  const getUsagePercentage = useCallback((resource: 'notes' | 'folders') => {
    if (!usage || !limits) return 0;
    
    const current = resource === 'notes' ? usage.notesCount : usage.foldersCount;
    const limit = resource === 'notes' ? limits.maxNotes : limits.maxFolders;
    
    return Math.round((current / limit) * 100);
  }, [usage, limits]);

  const isApproachingLimit = useCallback((resource: 'notes' | 'folders', threshold = 80) => {
    return getUsagePercentage(resource) >= threshold;
  }, [getUsagePercentage]);

  const getResourceStatus = useCallback((resource: 'notes' | 'folders') => {
    const percentage = getUsagePercentage(resource);
    
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 80) return 'warning';
    if (percentage >= 60) return 'moderate';
    return 'healthy';
  }, [getUsagePercentage]);

  return {
    usage,
    limits,
    isFreeTier,
    getUsagePercentage,
    isApproachingLimit,
    getResourceStatus,
  };
}