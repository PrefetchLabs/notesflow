import { useState, useEffect, useMemo } from 'react';
import { WebsocketProvider } from 'y-websocket';

export type CollaborationMode = 
  | 'private'           // No collaborators
  | 'shared-offline'    // Has collaborators but WebSocket down
  | 'shared-connecting' // Has collaborators, WebSocket connecting
  | 'shared-live';      // Has collaborators and WebSocket connected

export type SyncStatus = 
  | 'synced'      // All changes synced
  | 'syncing'     // Currently syncing
  | 'pending'     // Changes pending sync
  | 'error';      // Sync error

export interface CollaborationStatus {
  mode: CollaborationMode;
  syncStatus: SyncStatus;
  isShared: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  activeUsers: number;
  lastSyncTime?: Date;
  hasPendingChanges: boolean;
  syncWarning?: string;
}

interface UseCollaborationStatusOptions {
  provider: WebsocketProvider | null;
  isCollaborationEnabled: boolean;
  activeUsersCount: number;
  noteId: string;
}

export function useCollaborationStatus({
  provider,
  isCollaborationEnabled,
  activeUsersCount,
  noteId
}: UseCollaborationStatusOptions): CollaborationStatus {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Monitor provider connection status
  useEffect(() => {
    if (!provider) {
      setIsConnected(false);
      setIsConnecting(false);
      return;
    }

    const handleStatus = (event: any) => {
      if (event.status === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
        setLastSyncTime(new Date());
        setSyncStatus('synced');
        setHasPendingChanges(false);
      } else if (event.status === 'connecting') {
        setIsConnecting(true);
        setIsConnected(false);
      } else {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    const handleSync = (isSynced: boolean) => {
      if (isSynced) {
        setLastSyncTime(new Date());
        setSyncStatus('synced');
        setHasPendingChanges(false);
      } else {
        setSyncStatus('syncing');
      }
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);

    // Check initial status
    if ((provider as any).wsconnected) {
      setIsConnected(true);
      setLastSyncTime(new Date());
    }

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
    };
  }, [provider]);

  // Track local changes
  useEffect(() => {
    const trackChanges = () => {
      if (!isConnected && isCollaborationEnabled) {
        setHasPendingChanges(true);
        setSyncStatus('pending');
      }
    };

    // Listen for document changes
    const handleKeyPress = () => trackChanges();
    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [isConnected, isCollaborationEnabled]);

  // Calculate collaboration mode
  const mode = useMemo<CollaborationMode>(() => {
    if (!isCollaborationEnabled) {
      return 'private';
    }
    if (isConnected) {
      return 'shared-live';
    }
    if (isConnecting) {
      return 'shared-connecting';
    }
    return 'shared-offline';
  }, [isCollaborationEnabled, isConnected, isConnecting]);

  // Generate sync warning
  const syncWarning = useMemo(() => {
    if (mode === 'shared-offline' && hasPendingChanges) {
      return 'Your changes are saved locally but not syncing with collaborators. They will sync when connection is restored.';
    }
    if (mode === 'shared-offline' && activeUsersCount > 0) {
      return 'Multiple people may be editing this note offline. Changes will merge when connection is restored.';
    }
    return undefined;
  }, [mode, hasPendingChanges, activeUsersCount]);

  return {
    mode,
    syncStatus,
    isShared: isCollaborationEnabled,
    isConnected,
    isConnecting,
    activeUsers: activeUsersCount,
    lastSyncTime,
    hasPendingChanges,
    syncWarning
  };
}