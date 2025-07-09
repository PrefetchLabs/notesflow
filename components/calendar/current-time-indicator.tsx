'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  timeToPixelPosition,
  isWithinCalendarBounds,
  SLOT_HEIGHT_PX,
} from '@/lib/utils/time-blocks';

interface CurrentTimeIndicatorProps {
  currentWeek: Date;
}

export function CurrentTimeIndicator({ currentWeek }: CurrentTimeIndicatorProps) {
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

  // Check if current week contains today
  const today = new Date();
  const weekStart = new Date(currentWeek);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  if (today < weekStart || today > weekEnd) {
    return null;
  }

  const dayIndex = today.getDay();
  const topPosition = timeToPixelPosition(currentTime);

  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none z-10"
      style={{
        gridColumn: `2 / -1`, // Span all day columns
        gridRow: 2, // Start after header
      }}
      initial={{ opacity: 0, y: topPosition }}
      animate={{ opacity: 1, y: topPosition }}
      transition={{ 
        y: { type: "tween", ease: "linear", duration: 0.5 },
        opacity: { duration: 0.3 }
      }}
    >
      {/* Time indicator line */}
      <div className="relative">
        {/* Red dot at the start with pulse animation */}
        <motion.div
          className="absolute w-2 h-2 bg-red-500 rounded-full"
          style={{
            left: `${(dayIndex * (100 / 7))}%`,
            top: '-4px',
            marginLeft: '-4px',
          }}
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
        
        {/* Horizontal line for current day */}
        <motion.div
          className="absolute h-0.5 bg-red-500"
          style={{
            left: `${(dayIndex * (100 / 7))}%`,
            width: `${100 / 7}%`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </motion.div>
  );
}