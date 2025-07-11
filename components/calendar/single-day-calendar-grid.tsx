'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  SLOT_DURATION_MINUTES,
  SLOT_HEIGHT_PX,
  formatHourLabel,
} from '@/lib/utils/time-blocks';

interface SingleDayCalendarGridProps {
  currentDate: Date;
  onSlotClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSlotMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

export function SingleDayCalendarGrid({
  currentDate,
  onSlotClick,
  onSlotDoubleClick,
  onSlotMouseDown,
  onSlotMouseMove,
  onSlotMouseUp,
  onSlotMouseEnter,
  onSlotMouseLeave,
  children,
}: SingleDayCalendarGridProps) {
  const [timeSlots, setTimeSlots] = useState<Date[]>([]);

  // Generate time slots
  useEffect(() => {
    const slots: Date[] = [];
    const totalSlots = ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / SLOT_DURATION_MINUTES;
    
    for (let i = 0; i < totalSlots; i++) {
      const slot = new Date(currentDate);
      const totalMinutes = CALENDAR_START_HOUR * 60 + i * SLOT_DURATION_MINUTES;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      slot.setHours(hours, minutes, 0, 0);
      slots.push(slot);
    }
    
    setTimeSlots(slots);
  }, [currentDate]);

  return (
    <div className="calendar-grid flex flex-1 overflow-hidden">
      <div className="flex flex-1">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r">
          {timeSlots.map((time, slotIndex) => {
            const isHourStart = time.getMinutes() === 0;
            return (
              <div
                key={`time-${slotIndex}`}
                className={cn(
                  "h-5 flex items-center justify-end pr-2 text-xs text-muted-foreground border-b border-black/5 dark:border-white/5",
                  isHourStart && "font-medium"
                )}
              >
                {isHourStart && formatHourLabel(time)}
              </div>
            );
          })}
        </div>

        {/* Day column */}
        <div className="flex-1 relative">
          {/* Time slot grid */}
          <div 
            className="absolute inset-0"
            onMouseDown={onSlotMouseDown}
            onMouseMove={onSlotMouseMove}
            onMouseUp={onSlotMouseUp}
          >
            {timeSlots.map((_, slotIndex) => {
              const isHourStart = slotIndex % 4 === 0;
              return (
                <div
                  key={`slot-${slotIndex}`}
                  className={cn(
                    "h-5 border-b cursor-pointer hover:bg-accent/5 transition-colors",
                    isHourStart ? "border-black/10 dark:border-white/10" : "border-black/5 dark:border-white/5"
                  )}
                  data-slot-index={slotIndex}
                  data-slot-time={timeSlots[slotIndex]?.toISOString()}
                  onClick={onSlotClick}
                  onDoubleClick={onSlotDoubleClick}
                  onMouseEnter={onSlotMouseEnter}
                  onMouseLeave={onSlotMouseLeave}
                />
              );
            })}
          </div>

          {/* Content overlay for time blocks */}
          <div className="absolute inset-0 pointer-events-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}