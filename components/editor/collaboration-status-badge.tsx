'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Users, 
  WifiOff, 
  Circle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { CollaborationMode, SyncStatus } from '@/hooks/useCollaborationStatus';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

interface CollaborationStatusBadgeProps {
  mode: CollaborationMode;
  syncStatus: SyncStatus;
  activeUsers: number;
  lastSyncTime?: Date;
  className?: string;
}

export function CollaborationStatusBadge({
  mode,
  syncStatus,
  activeUsers,
  lastSyncTime,
  className
}: CollaborationStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (mode) {
      case 'private':
        return {
          icon: Lock,
          label: 'Private Note',
          variant: 'secondary' as const,
          tooltip: 'This note is private to you',
          pulseColor: null
        };
      
      case 'shared-live':
        return {
          icon: Users,
          label: activeUsers > 1 ? `${activeUsers} Editing` : 'Shared',
          variant: 'default' as const,
          tooltip: 'Real-time collaboration active',
          pulseColor: 'bg-green-500'
        };
      
      case 'shared-connecting':
        return {
          icon: Users,
          label: 'Connecting...',
          variant: 'secondary' as const,
          tooltip: 'Establishing connection for real-time collaboration',
          pulseColor: 'bg-yellow-500'
        };
      
      case 'shared-offline':
        return {
          icon: WifiOff,
          label: 'Offline Mode',
          variant: 'destructive' as const,
          tooltip: 'Changes saved locally. Will sync when connection is restored.',
          pulseColor: null
        };
    }
  };

  const getSyncIndicator = () => {
    switch (syncStatus) {
      case 'synced':
        return { color: 'bg-green-500', animate: false };
      case 'syncing':
        return { color: 'bg-blue-500', animate: true };
      case 'pending':
        return { color: 'bg-yellow-500', animate: false };
      case 'error':
        return { color: 'bg-red-500', animate: false };
    }
  };

  const config = getStatusConfig();
  const syncIndicator = getSyncIndicator();
  const Icon = config.icon;

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={cn(
              'flex items-center gap-2 px-3 py-1 transition-all duration-200',
              className
            )}
          >
            <div className="relative">
              <Icon className="h-4 w-4" />
              {config.pulseColor && (
                <motion.div
                  className={cn(
                    'absolute -inset-1 rounded-full opacity-75',
                    config.pulseColor
                  )}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            
            <span className="font-medium">{config.label}</span>
            
            {/* Sync Status Indicator */}
            {mode !== 'private' && (
              <div className="flex items-center gap-1">
                <Circle
                  className={cn(
                    'h-2 w-2 fill-current',
                    syncIndicator.color,
                    syncIndicator.animate && 'animate-pulse'
                  )}
                />
                {syncStatus === 'pending' && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            )}
          </Badge>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{config.tooltip}</p>
            
            {mode !== 'private' && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Sync Status:</span>
                  <span className="capitalize">{syncStatus}</span>
                </div>
                {lastSyncTime && (
                  <div className="flex items-center justify-between">
                    <span>Last Sync:</span>
                    <span>{formatLastSync()}</span>
                  </div>
                )}
                {activeUsers > 1 && (
                  <div className="flex items-center justify-between">
                    <span>Active Users:</span>
                    <span>{activeUsers}</span>
                  </div>
                )}
              </div>
            )}
            
            {mode === 'shared-offline' && (
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Info className="h-3 w-3" />
                <span>Edits will sync when reconnected</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}