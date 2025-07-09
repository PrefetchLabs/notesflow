'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  timeToPixelPosition,
  isWithinCalendarBounds,
} from '@/lib/utils/time-blocks';

interface CurrentTimeIndicatorProps {
  currentDate: Date;
}

export function CurrentTimeIndicator({ currentDate }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Check if current time is within calendar bounds
  if (!isWithinCalendarBounds(currentTime)) {
    return null;
  }

  // Check if we're showing today
  const today = new Date();
  if (currentDate.toDateString() !== today.toDateString()) {
    return null;
  }

  const topPosition = timeToPixelPosition(currentTime);

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none z-20"
      style={{
        top: `${topPosition}px`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        opacity: { duration: 0.3 }
      }}
    >
      {/* Time indicator line */}
      <div className="relative flex items-center">
        {/* Red dot at the start with pulse animation */}
        <motion.div
          className="absolute w-3 h-3 bg-red-500 rounded-full -left-1"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500"
            animate={{
              scale: [1, 2, 2],
              opacity: [0.4, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>
        
        {/* Horizontal line */}
        <motion.div
          className="h-0.5 bg-red-500 flex-1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ transformOrigin: 'left' }}
        />
        
        {/* Current time label */}
        <div className="absolute -right-12 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
          {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}