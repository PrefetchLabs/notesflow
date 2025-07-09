'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeBlockErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function TimeBlockError({ 
  message = "Failed to load time blocks", 
  onRetry 
}: TimeBlockErrorProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-destructive/10 rounded-lg p-6 max-w-sm mx-4 text-center space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-destructive">Error</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        
        {onRetry && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}