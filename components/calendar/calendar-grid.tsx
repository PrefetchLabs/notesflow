'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  SLOT_DURATION_MINUTES,
  SLOT_HEIGHT_PX,
  TIME_COLUMN_WIDTH,
  DAY_COLUMN_WIDTH,
  getWeekDates,
  formatHourLabel,
  getTotalSlotsPerDay,
} from '@/lib/utils/time-blocks';

interface CalendarGridProps {
  currentWeek: Date;
  children?: React.ReactNode;
}

export function CalendarGrid({ currentWeek, children }: CalendarGridProps) {
  const weekDates = getWeekDates(currentWeek);
  const totalSlots = getTotalSlotsPerDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate time slots
  const timeSlots: Date[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const date = new Date();
    date.setHours(CALENDAR_START_HOUR, 0, 0, 0);
    date.setMinutes(i * SLOT_DURATION_MINUTES);
    timeSlots.push(date);
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Grid Container */}
      <div 
        className="calendar-grid h-full overflow-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `${TIME_COLUMN_WIDTH} repeat(7, ${DAY_COLUMN_WIDTH})`,
          gridTemplateRows: `auto repeat(${totalSlots}, ${SLOT_HEIGHT_PX}px)`,
        }}
      >
        {/* Time column header */}
        <div className="sticky top-0 z-20 bg-background border-b border-r" />
        
        {/* Day headers */}
        {weekDates.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div
              key={index}
              className={cn(
                "sticky top-0 z-20 bg-background border-b p-2 text-center",
                index < 6 && "border-r",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                "text-sm font-medium",
                isToday && "text-primary"
              )}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}

        {/* Time slots */}
        {timeSlots.map((time, slotIndex) => {
          const isHourStart = time.getMinutes() === 0;
          return (
            <React.Fragment key={`slot-${slotIndex}`}>
              {/* Time label */}
              <div
                className={cn(
                  "text-right pr-2 text-xs text-muted-foreground",
                  isHourStart && "font-medium",
                  !isHourStart && "opacity-0"
                )}
                style={{
                  gridRow: slotIndex + 2,
                  gridColumn: 1,
                }}
              >
                {isHourStart && formatHourLabel(time)}
              </div>

              {/* Day cells */}
              {weekDates.map((date, dayIndex) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={`slot-${slotIndex}-${dayIndex}`}
                    className={cn(
                      "calendar-slot border-r border-b relative transition-colors duration-150",
                      "hover:bg-muted/20",
                      dayIndex === 6 && "border-r-0",
                      isHourStart ? "border-b-border" : "border-b-border/30",
                      isToday && "bg-primary/5 hover:bg-primary/10"
                    )}
                    style={{
                      gridRow: slotIndex + 2,
                      gridColumn: dayIndex + 2,
                    }}
                    data-slot-index={slotIndex}
                    data-day-index={dayIndex}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Content overlay for time blocks */}
        {children}
      </div>
    </div>
  );
}