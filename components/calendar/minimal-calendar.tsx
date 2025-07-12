'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const HOUR_HEIGHT = 80; // Height of each hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

interface MinimalCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (startTime: Date, endTime: Date) => void;
  onCreateTask?: (startTime: Date, endTime: Date) => void;
  blocks?: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
    isCompleted: boolean;
  }>;
}

interface DragSelection {
  startY: number;
  endY: number;
  startTime: string;
  endTime: string;
}

export function MinimalCalendar({ 
  currentDate, 
  onDateChange, 
  onCreateEvent, 
  onCreateTask,
  blocks = []
}: MinimalCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert Y position to time
  const yToTime = useCallback((y: number): { hour: number; minutes: number } => {
    const hour = Math.floor(y / HOUR_HEIGHT);
    const minuteOffset = ((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60;
    const minutes = Math.round(minuteOffset / 15) * 15; // Round to 15-minute intervals
    
    return {
      hour: Math.max(0, Math.min(23, hour)),
      minutes: minutes >= 60 ? 0 : minutes
    };
  }, []);

  // Format time for display
  const formatTime = (hour: number, minutes: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Handle mouse down to start drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    
    const time = yToTime(y);
    const startTime = formatTime(time.hour, time.minutes);
    
    setIsDragging(true);
    setDragSelection({
      startY: y,
      endY: y,
      startTime,
      endTime: startTime
    });
  }, [yToTime]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragSelection || !gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    
    const time = yToTime(y);
    const endTime = formatTime(time.hour, time.minutes);
    
    setDragSelection({
      ...dragSelection,
      endY: y,
      endTime
    });
  }, [isDragging, dragSelection, yToTime]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragSelection) return;
    
    setIsDragging(false);
    
    // Only show menu if selection is at least 30 minutes
    const startY = Math.min(dragSelection.startY, dragSelection.endY);
    const endY = Math.max(dragSelection.startY, dragSelection.endY);
    const duration = endY - startY;
    
    if (duration >= HOUR_HEIGHT / 2) { // At least 30 minutes
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setShowMenu(true);
    } else {
      setDragSelection(null);
    }
  }, [isDragging, dragSelection]);

  // Handle menu item clicks
  const handleCreateEvent = () => {
    if (!dragSelection || !onCreateEvent) return;
    
    // Parse times and create Date objects
    const [startHour, startMin] = dragSelection.startTime.split(':').map(Number);
    const [endHour, endMin] = dragSelection.endTime.split(':').map(Number);
    
    const startTime = new Date(currentDate);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, endMin, 0, 0);
    
    // If end time is before start time, it's the next day
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    onCreateEvent(startTime, endTime);
    setShowMenu(false);
    setDragSelection(null);
  };

  const handleCreateTask = () => {
    if (!dragSelection || !onCreateTask) return;
    
    // Parse times and create Date objects
    const [startHour, startMin] = dragSelection.startTime.split(':').map(Number);
    const [endHour, endMin] = dragSelection.endTime.split(':').map(Number);
    
    const startTime = new Date(currentDate);
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, endMin, 0, 0);
    
    // If end time is before start time, it's the next day
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    onCreateTask(startTime, endTime);
    setShowMenu(false);
    setDragSelection(null);
  };

  // Close menu on outside click
  useEffect(() => {
    if (showMenu) {
      const handleClick = () => {
        setShowMenu(false);
        setDragSelection(null);
      };
      
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollPosition = now.getHours() * HOUR_HEIGHT - 200;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            Today<br />
            <span className="text-gray-400">AEST</span>
          </div>
          <div className="text-sm font-medium text-gray-200">
            {format(currentDate, 'EEE MMM d')}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-200"
            onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-200"
            onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div 
          ref={gridRef}
          className="relative select-none"
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-16 flex-shrink-0 text-right pr-3 pt-2">
                <span className="text-xs text-gray-500">
                  {hour} {hour < 12 ? 'AM' : 'PM'}
                </span>
              </div>
              <div className="flex-1 border-t border-gray-800" />
            </div>
          ))}

          {/* Drag selection overlay */}
          {dragSelection && (
            <div
              className={cn(
                "absolute left-16 right-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg",
                "pointer-events-none"
              )}
              style={{
                top: `${Math.min(dragSelection.startY, dragSelection.endY)}px`,
                height: `${Math.abs(dragSelection.endY - dragSelection.startY)}px`,
              }}
            >
              <div className="px-3 py-1 text-sm text-blue-200">
                {dragSelection.startTime} - {dragSelection.endTime}
              </div>
            </div>
          )}

          {/* Render blocks */}
          {blocks.map((block) => {
            const startHour = block.startTime.getHours();
            const startMinutes = block.startTime.getMinutes();
            const endHour = block.endTime.getHours();
            const endMinutes = block.endTime.getMinutes();
            
            const top = startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
            const height = (endHour - startHour) * HOUR_HEIGHT + ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
            
            return (
              <div
                key={block.id}
                className="absolute left-16 right-4 rounded-lg p-2 text-xs text-white"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: block.color || '#3B82F6',
                  opacity: block.isCompleted ? 0.6 : 1,
                }}
              >
                <div className="font-medium truncate">{block.title}</div>
                <div className="text-xs opacity-80">
                  {format(block.startTime, 'HH:mm')} - {format(block.endTime, 'HH:mm')}
                </div>
              </div>
            );
          })}

          {/* Current time indicator */}
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
            style={{ 
              top: `${new Date().getHours() * HOUR_HEIGHT + (new Date().getMinutes() / 60) * HOUR_HEIGHT}px` 
            }}
          >
            <div className="w-16" />
            <div className="h-0.5 bg-red-500 flex-1" />
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
          </div>
        </div>
      </ScrollArea>

      {/* Create menu popup */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-1"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3"
              onClick={handleCreateEvent}
            >
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              Create event
            </button>
            <button
              className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3"
              onClick={handleCreateTask}
            >
              <CheckSquare className="h-4 w-4 text-gray-400" />
              Create task (fixed time)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}