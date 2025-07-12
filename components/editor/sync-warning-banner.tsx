'use client';

import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SyncWarningBannerProps {
  warning?: string;
  onDismiss?: () => void;
  className?: string;
}

export function SyncWarningBanner({ 
  warning, 
  onDismiss,
  className 
}: SyncWarningBannerProps) {
  if (!warning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Sync Warning
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {warning}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <Info className="h-3 w-3" />
                <span>Your changes are being saved locally</span>
              </div>
            </div>
          </div>
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}