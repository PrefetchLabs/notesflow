'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, Circle, CheckCircle2, Coffee, Clock, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ColorPalette } from './color-palette';
import { useResponsive } from '@/hooks/useResponsive';

const HOUR_HEIGHT = 60; // Height of each hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

// Task presets for specific user - colors work well in both light and dark modes
const TASK_PRESETS = [
  { title: 'Coding', emoji: '💻', color: '#60A5FA' }, // Blue 400
  { title: 'Research', emoji: '🔍', color: '#A78BFA' }, // Purple 400
  { title: 'Break', emoji: '☕', color: '#4ADE80' }, // Green 400
  { title: 'Crypto', emoji: '🪙', color: '#FBBF24' }, // Amber 400
  { title: 'Food', emoji: '🍽️', color: '#F87171' }, // Red 400
];

interface MinimalCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (startTime: Date, endTime: Date) => void;
  onCreateTask?: (startTime: Date, endTime: Date, title?: string, color?: string, icon?: string) => void;
  onUpdateBlock?: (id: string, startTime: Date, endTime: Date) => void;
  onDeleteBlock?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onRenameBlock?: (id: string, newTitle: string) => void;
  onUpdateColor?: (id: string, color: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  userEmail?: string;
  blocks?: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
    icon?: string;
    isCompleted: boolean;
    type?: 'event' | 'task';
  }>;
}

interface DragSelection {
  startY: number;
  endY: number;
  startTime: string;
  endTime: string;
}

interface GhostBlock {
  id: string;
  startY: number;
  height: number;
}

export function MinimalCalendar({ 
  currentDate, 
  onDateChange, 
  onCreateEvent, 
  onCreateTask,
  onUpdateBlock,
  onDeleteBlock,
  onToggleComplete,
  onRenameBlock,
  onUpdateColor,
  onInteractionStart,
  onInteractionEnd,
  userEmail,
  blocks = []
}: MinimalCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [mouseOffsetY, setMouseOffsetY] = useState(0);
  const [resizingBlock, setResizingBlock] = useState<{
    id: string;
    initialEndTime: Date;
    initialMouseY: number;
  } | null>(null);
  const [ghostBlock, setGhostBlock] = useState<GhostBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [colorPalettePosition, setColorPalettePosition] = useState({ x: 0, y: 0 });
  const [selectedBlockForColor, setSelectedBlockForColor] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useResponsive();
  const touchStartXRef = useRef<number | null>(null);

  // Check if user is special user
  const isSpecialUser = userEmail === 'samid@pockethunter.io';

  // Get current event
  const getCurrentEvent = useCallback(() => {
    const now = currentTime.getTime();
    
    // Only check today's blocks
    const todayBlocks = blocks.filter(block => {
      const blockDate = new Date(block.startTime);
      return (
        blockDate.getFullYear() === currentDate.getFullYear() &&
        blockDate.getMonth() === currentDate.getMonth() &&
        blockDate.getDate() === currentDate.getDate()
      );
    });
    
    return todayBlocks.find(block => {
      const startTime = block.startTime.getTime();
      const endTime = block.endTime.getTime();
      return now >= startTime && now < endTime;
    });
  }, [blocks, currentTime, currentDate]);

  // Calculate time remaining for current event
  const getTimeRemaining = useCallback((endTime: Date) => {
    const now = currentTime.getTime();
    const end = endTime.getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Ending now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  }, [currentTime]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  // Track user interactions
  const updateLastInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    
    // Clear existing idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // Set new idle timer (30 seconds)
    idleTimerRef.current = setTimeout(() => {
      // Check if we're viewing today and should auto-center
      const now = new Date();
      const isToday = 
        currentDate.getFullYear() === now.getFullYear() &&
        currentDate.getMonth() === now.getMonth() &&
        currentDate.getDate() === now.getDate();
      
      if (isToday && scrollRef.current) {
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const containerHeight = scrollRef.current.clientHeight;
        const currentTimePosition = currentHour * HOUR_HEIGHT + (currentMinutes / 60) * HOUR_HEIGHT;
        const currentScroll = scrollRef.current.scrollTop;
        
        // Check if current time is more than 2 hours away from center
        const centerPosition = currentScroll + (containerHeight / 2);
        const hoursDiff = Math.abs(currentTimePosition - centerPosition) / HOUR_HEIGHT;
        
        if (hoursDiff > 2) {
          // Gentle re-center with slower animation
          const idealScrollPosition = currentTimePosition - (containerHeight / 2) + (HOUR_HEIGHT / 2);
          const maxScroll = scrollRef.current.scrollHeight - containerHeight;
          const targetScroll = Math.max(0, Math.min(idealScrollPosition, maxScroll));
          
          scrollRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    }, 30000); // 30 seconds idle time
  }, [currentDate]);

  // Clean up idle timer on unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // Check if a time range overlaps with existing blocks
  const hasOverlap = useCallback((startTime: Date, endTime: Date, excludeId?: string) => {
    return blocks.some(block => {
      if (excludeId && block.id === excludeId) return false;
      
      const blockStart = block.startTime.getTime();
      const blockEnd = block.endTime.getTime();
      const selectionStart = startTime.getTime();
      const selectionEnd = endTime.getTime();
      
      return (selectionStart < blockEnd && selectionEnd > blockStart);
    });
  }, [blocks]);

  // Convert Y position to time with grid snapping
  const yToTime = useCallback((y: number): { hour: number; minutes: number } => {
    const snapInterval = 15; // 15-minute intervals
    const pixelsPerMinute = HOUR_HEIGHT / 60;
    const totalMinutes = Math.round(y / pixelsPerMinute / snapInterval) * snapInterval;
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return {
      hour: Math.min(23, Math.max(0, hour)),
      minutes: Math.min(45, Math.max(0, minutes))
    };
  }, []);

  // Convert time to Y position
  const timeToY = useCallback((hour: number, minutes: number): number => {
    return hour * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  }, []);

  // Format time for display
  const formatTime = (hour: number, minutes: number): string => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  // Handle grid mouse down for drag selection
  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on a block
    if ((e.target as HTMLElement).closest('.calendar-block')) return;
    if (!gridRef.current) return;
    
    updateLastInteraction();
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    
    const time = yToTime(y);
    const snappedY = timeToY(time.hour, time.minutes);
    const startTime = formatTime(time.hour, time.minutes);
    
    setIsDragging(true);
    onInteractionStart?.();
    setDragSelection({
      startY: snappedY,
      endY: snappedY,
      startTime,
      endTime: startTime
    });
  }, [yToTime, timeToY, onInteractionStart, updateLastInteraction]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!gridRef.current) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    
    if (isDragging && dragSelection) {
      const time = yToTime(y);
      const snappedY = timeToY(time.hour, time.minutes);
      const endTime = formatTime(time.hour, time.minutes);
      
      setDragSelection({
        ...dragSelection,
        endY: snappedY,
        endTime
      });
    } else if (draggingBlock && ghostBlock) {
      const block = blocks.find(b => b.id === draggingBlock);
      if (!block) return;
      
      // Calculate new position accounting for mouse offset and snap to grid
      const newY = y - mouseOffsetY;
      const time = yToTime(newY);
      const snappedY = timeToY(time.hour, time.minutes);
      
      setGhostBlock({
        ...ghostBlock,
        startY: Math.max(0, snappedY)
      });
    } else if (resizingBlock) {
      const block = blocks.find(b => b.id === resizingBlock.id);
      if (!block) return;
      
      // Calculate new end time based on mouse position
      const deltaY = e.clientY - resizingBlock.initialMouseY;
      const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // Snap to 15 min
      
      const newEndTime = new Date(resizingBlock.initialEndTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + deltaMinutes);
      
      // Ensure minimum duration of 15 minutes
      const minEndTime = new Date(block.startTime);
      minEndTime.setMinutes(minEndTime.getMinutes() + 15);
      
      if (newEndTime > minEndTime) {
        const height = ((newEndTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
        setGhostBlock({
          id: resizingBlock.id,
          startY: block.startTime.getHours() * HOUR_HEIGHT + (block.startTime.getMinutes() / 60) * HOUR_HEIGHT,
          height: Math.max(HOUR_HEIGHT / 4, height) // Min 15 minutes
        });
      }
    }
  }, [isDragging, dragSelection, draggingBlock, ghostBlock, mouseOffsetY, blocks, yToTime, timeToY, resizingBlock]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragSelection) {
      setIsDragging(false);
      onInteractionEnd?.();
      
      // Calculate duration
      const minY = Math.min(dragSelection.startY, dragSelection.endY);
      const maxY = Math.max(dragSelection.startY, dragSelection.endY);
      const durationMinutes = ((maxY - minY) / HOUR_HEIGHT) * 60;
      
      if (durationMinutes >= 15) { // At least 15 minutes
        // Calculate times from Y positions instead of parsing formatted strings
        const startTimeInfo = yToTime(minY);
        const endTimeInfo = yToTime(maxY);
        
        const actualStartHour = startTimeInfo.hour;
        const actualStartMin = startTimeInfo.minutes;
        const actualEndHour = endTimeInfo.hour;
        const actualEndMin = endTimeInfo.minutes;
        
        const startTime = new Date(currentDate);
        startTime.setHours(actualStartHour, actualStartMin, 0, 0);
        
        const endTime = new Date(currentDate);
        endTime.setHours(actualEndHour, actualEndMin, 0, 0);
        
        // Handle events that span to next day
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }
        
        // Check for overlap
        if (!hasOverlap(startTime, endTime)) {
          // Show context menu
          const rect = gridRef.current?.getBoundingClientRect();
          if (rect) {
            setMenuPosition({
              x: e.clientX - rect.left,
              y: Math.min(dragSelection.startY, dragSelection.endY) + 50
            });
            setShowMenu(true);
          }
        }
      }
    } else if (draggingBlock && ghostBlock) {
      // Handle block drag end
      const blockToUpdate = blocks.find(b => b.id === draggingBlock);
      if (blockToUpdate && onUpdateBlock) {
        const time = yToTime(ghostBlock.startY);
        const newStartTime = new Date(currentDate);
        newStartTime.setHours(time.hour, time.minutes, 0, 0);
        
        const duration = blockToUpdate.endTime.getTime() - blockToUpdate.startTime.getTime();
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        // Check if new position overlaps
        if (!hasOverlap(newStartTime, newEndTime, draggingBlock)) {
          onUpdateBlock(draggingBlock, newStartTime, newEndTime);
        }
      }
      
      setDraggingBlock(null);
      setGhostBlock(null);
      onInteractionEnd?.();
    } else if (resizingBlock && ghostBlock) {
      // Handle resize end
      const blockToUpdate = blocks.find(b => b.id === resizingBlock.id);
      if (blockToUpdate && onUpdateBlock && ghostBlock.height) {
        const durationHours = ghostBlock.height / HOUR_HEIGHT;
        const newEndTime = new Date(blockToUpdate.startTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + durationHours * 60);
        
        // Check if new size overlaps
        if (!hasOverlap(blockToUpdate.startTime, newEndTime, resizingBlock.id)) {
          onUpdateBlock(resizingBlock.id, blockToUpdate.startTime, newEndTime);
        }
      }
      
      setResizingBlock(null);
      setGhostBlock(null);
      onInteractionEnd?.();
    }
  }, [isDragging, dragSelection, draggingBlock, ghostBlock, resizingBlock, blocks, currentDate, hasOverlap, onUpdateBlock, onInteractionEnd, yToTime]);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    
    // Convert touch to mouse event for drag handling
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: e.target,
    } as unknown as React.MouseEvent;
    
    handleGridMouseDown(mouseEvent);
  }, [handleGridMouseDown]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartXRef.current);
      
      // Only handle as tap if minimal horizontal movement
      if (deltaX < 10) {
        const mouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: e.target,
        } as unknown as React.MouseEvent;
        
        handleMouseUp(mouseEvent);
      }
    }
    
    touchStartXRef.current = null;
  }, [handleMouseUp]);

  // Context menu handlers
  const handleCreateEvent = useCallback(() => {
    if (!dragSelection || !onCreateEvent) return;
    
    // Calculate times from Y positions
    const minY = Math.min(dragSelection.startY, dragSelection.endY);
    const maxY = Math.max(dragSelection.startY, dragSelection.endY);
    const startTimeInfo = yToTime(minY);
    const endTimeInfo = yToTime(maxY);
    
    const actualStartHour = startTimeInfo.hour;
    const actualStartMin = startTimeInfo.minutes;
    const actualEndHour = endTimeInfo.hour;
    const actualEndMin = endTimeInfo.minutes;
    
    const startTime = new Date(currentDate);
    startTime.setHours(actualStartHour, actualStartMin, 0, 0);
    
    const endTime = new Date(currentDate);
    endTime.setHours(actualEndHour, actualEndMin, 0, 0);
    
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    onCreateEvent(startTime, endTime);
    setShowMenu(false);
    setDragSelection(null);
  }, [dragSelection, onCreateEvent, currentDate]);

  const handleCreateTask = useCallback((title?: string, color?: string, icon?: string) => {
    if (!dragSelection || !onCreateTask) return;
    
    // Calculate times from Y positions
    const minY = Math.min(dragSelection.startY, dragSelection.endY);
    const maxY = Math.max(dragSelection.startY, dragSelection.endY);
    const startTimeInfo = yToTime(minY);
    const endTimeInfo = yToTime(maxY);
    
    const actualStartHour = startTimeInfo.hour;
    const actualStartMin = startTimeInfo.minutes;
    const actualEndHour = endTimeInfo.hour;
    const actualEndMin = endTimeInfo.minutes;
    
    const startDateTime = new Date(currentDate);
    startDateTime.setHours(actualStartHour, actualStartMin, 0, 0);
    
    const endDateTime = new Date(currentDate);
    endDateTime.setHours(actualEndHour, actualEndMin, 0, 0);
    
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
    
    onCreateTask(startDateTime, endDateTime, title, color, icon);
    setShowMenu(false);
    setDragSelection(null);
  }, [dragSelection, onCreateTask, currentDate]);

  // Handle block drag start
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!gridRef.current) return;
    
    // Close any open menus when starting new interaction
    setShowMenu(false);
    setShowColorPalette(false);
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const startY = block.startTime.getHours() * HOUR_HEIGHT + (block.startTime.getMinutes() / 60) * HOUR_HEIGHT;
    const height = ((block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
    
    // Calculate mouse offset from block's top edge
    const mouseY = e.clientY - rect.top + scrollTop;
    const offset = mouseY - startY;
    
    setDraggingBlock(blockId);
    setMouseOffsetY(offset);
    setGhostBlock({
      id: blockId,
      startY: startY,
      height: height
    });
    
    onInteractionStart?.();
  }, [blocks, onInteractionStart]);

  // Handle resize start
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Close any open menus when starting new interaction
    setShowMenu(false);
    setShowColorPalette(false);
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    setResizingBlock({
      id: blockId,
      initialEndTime: block.endTime,
      initialMouseY: e.clientY
    });
    
    // Set ghost block to show current size
    const startY = block.startTime.getHours() * HOUR_HEIGHT + (block.startTime.getMinutes() / 60) * HOUR_HEIGHT;
    const height = ((block.endTime.getTime() - block.startTime.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
    
    setGhostBlock({
      id: blockId,
      startY: startY,
      height: height
    });
    
    onInteractionStart?.();
  }, [blocks, onInteractionStart]);

  // Handle double click to edit block title
  const handleBlockDoubleClick = useCallback((e: React.MouseEvent, block: { id: string; title: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingBlockId(block.id);
    setEditingTitle(block.title);
    onInteractionStart?.();
  }, [onInteractionStart]);

  // Handle title edit submit
  const handleTitleSubmit = useCallback((blockId: string) => {
    if (onRenameBlock && editingTitle.trim()) {
      onRenameBlock(blockId, editingTitle.trim());
    }
    setEditingBlockId(null);
    setEditingTitle('');
    onInteractionEnd?.();
  }, [onRenameBlock, editingTitle, onInteractionEnd]);

  // Handle checkbox click for tasks
  const handleCheckboxClick = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleComplete) {
      onToggleComplete(blockId);
    }
  }, [onToggleComplete]);


  // Scroll to current time on mount and when date changes
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const now = new Date();
    
    // Check if we're viewing today
    const isToday = 
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getDate() === now.getDate();
    
    if (isToday) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Get the scroll container height
        const containerHeight = scrollRef.current.clientHeight;
        
        // Calculate the exact position of current time
        const currentTimePosition = currentHour * HOUR_HEIGHT + (currentMinutes / 60) * HOUR_HEIGHT;
        
        // Calculate scroll position to perfectly center current time
        // Add half hour height to center the line itself, not just the hour block
        const idealScrollPosition = currentTimePosition - (containerHeight / 2) + (HOUR_HEIGHT / 2);
        
        // Ensure we don't scroll past bounds
        const maxScroll = scrollRef.current.scrollHeight - containerHeight;
        const targetScroll = Math.max(0, Math.min(idealScrollPosition, maxScroll));
        
        scrollRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      });
    }
  }, [currentDate]);

  // Listen for keyboard shortcut to go to today
  useEffect(() => {
    const handleGoToToday = () => {
      const today = new Date();
      onDateChange(today);
    };

    window.addEventListener('calendar-today', handleGoToToday);
    return () => window.removeEventListener('calendar-today', handleGoToToday);
  }, [onDateChange]);

  // Handle touch events for swipe navigation
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartXRef.current || !isMobile) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - next day
        onDateChange(new Date(currentDate.getTime() + 86400000));
      } else {
        // Swipe right - previous day
        onDateChange(new Date(currentDate.getTime() - 86400000));
      }
    }
    
    touchStartXRef.current = null;
  }, [currentDate, onDateChange, isMobile]);

  const currentEvent = getCurrentEvent();
  const isToday = 
    currentDate.getFullYear() === currentTime.getFullYear() &&
    currentDate.getMonth() === currentTime.getMonth() &&
    currentDate.getDate() === currentTime.getDate();

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Current Event Status */}
      {isToday && (
        <div className="flex-shrink-0 border-b bg-muted/30">
          <AnimatePresence mode="wait">
            {currentEvent ? (
              <motion.div
                key="event"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: currentEvent.color || '#60A5FA' }}
                    />
                    <div>
                      <div className="font-medium text-sm">{currentEvent.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(currentEvent.startTime, 'h:mm a')} - {format(currentEvent.endTime, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeRemaining(currentEvent.endTime)}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: currentEvent.color || '#60A5FA' }}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min(100, Math.max(0, 
                        ((currentTime.getTime() - currentEvent.startTime.getTime()) / 
                         (currentEvent.endTime.getTime() - currentEvent.startTime.getTime())) * 100
                      ))}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="free"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Coffee className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Free time</div>
                    <div className="text-xs text-muted-foreground">No events scheduled</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Header */}
      <div 
        className="flex-shrink-0 px-4 py-3 border-b bg-background"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              AEST
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-sm font-medium">
              {format(currentDate, 'EEE MMM d')}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onDateChange(new Date())}
                title="Go to today (T)"
              >
                Today
              </Button>
            )}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}
                title="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}
                title="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <ScrollArea 
        className="flex-1 overflow-hidden" 
        ref={scrollRef}
        onScroll={updateLastInteraction}
      >
        <div 
          ref={gridRef}
          className="relative select-none"
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px`, minHeight: '100%' }}
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background click area */}
          <div className={cn(
            "absolute inset-0",
            isMobile ? "left-12" : "left-16"
          )} />
          
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex pointer-events-none"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className={cn(
                "flex-shrink-0 text-right pt-2",
                isMobile ? "w-12 pr-2" : "w-16 pr-3"
              )}>
                <span className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {isMobile ? (
                    // Show just the hour on mobile
                    hour === 0 ? '12' : hour > 12 ? hour - 12 : hour
                  ) : (
                    // Show full time on desktop
                    `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour} ${hour < 12 ? 'AM' : 'PM'}`
                  )}
                </span>
              </div>
              <div className="flex-1 border-t border-border" />
            </div>
          ))}



          {/* Render blocks */}
          {blocks
            .filter((block) => {
              // Filter blocks to only show those on the current date
              const blockDate = new Date(block.startTime);
              return (
                blockDate.getFullYear() === currentDate.getFullYear() &&
                blockDate.getMonth() === currentDate.getMonth() &&
                blockDate.getDate() === currentDate.getDate()
              );
            })
            .map((block) => {
            const startHour = block.startTime.getHours();
            const startMinutes = block.startTime.getMinutes();
            const endHour = block.endTime.getHours();
            const endMinutes = block.endTime.getMinutes();
            
            const top = startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
            const height = (endHour - startHour) * HOUR_HEIGHT + ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
            const isHovered = hoveredBlockId === block.id;
            
            return (
              <div
                key={block.id}
                className={cn(
                  "calendar-block absolute rounded-lg p-2 text-xs group cursor-move transition-all",
                  isMobile ? "left-12 right-2" : "left-16 right-4",
                  "hover:shadow-lg",
                  // Light mode: solid background with white text
                  "bg-opacity-100 text-white border-2 border-transparent",
                  // Dark mode: semi-transparent background with colored border
                  "dark:bg-opacity-20 dark:backdrop-blur-sm dark:border-opacity-40 dark:text-white"
                )}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(30, height)}px`, // Min height for visibility
                  backgroundColor: block.color || '#93BBFC',
                  borderColor: block.color || '#93BBFC',
                  opacity: block.isCompleted ? 0.6 : 1,
                }}
                onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedBlockForColor(block.id);
                  setColorPalettePosition({ x: e.clientX, y: e.clientY });
                  setShowColorPalette(true);
                }}
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
              >
                <div className="flex justify-between items-start gap-1">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    {/* Checkbox for tasks */}
                    {block.type === 'task' && onToggleComplete && (
                      <button
                        className="mt-0.5 flex-shrink-0 hover:opacity-80 transition-opacity"
                        onClick={(e) => handleCheckboxClick(e, block.id)}
                      >
                        {block.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-white fill-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-white/80" />
                        )}
                      </button>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {editingBlockId === block.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleTitleSubmit(block.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTitleSubmit(block.id);
                            } else if (e.key === 'Escape') {
                              setEditingBlockId(null);
                              setEditingTitle('');
                              onInteractionEnd?.();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-black/30 rounded px-1 py-0 text-white text-xs font-medium outline-none ring-1 ring-white/30 focus:ring-white/50"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className={cn(
                            "font-medium truncate cursor-text flex items-center gap-1.5",
                            block.isCompleted && "line-through opacity-75"
                          )}
                          onDoubleClick={(e) => handleBlockDoubleClick(e, block)}
                        >
                          {block.icon && <span className="text-sm">{block.icon}</span>}
                          <span>{block.title}</span>
                        </div>
                      )}
                      <div className="text-xs opacity-80">
                        {format(block.startTime, 'h:mm a')} - {format(block.endTime, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  {onDeleteBlock && (
                    <button
                      className={cn(
                        "p-1 rounded hover:bg-white/20 transition-all flex-shrink-0",
                        isHovered ? "opacity-100" : "opacity-0"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteBlock(block.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                {/* Resize handle at bottom */}
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize",
                    "hover:bg-white/20 transition-colors",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                  onMouseDown={(e) => handleResizeMouseDown(e, block.id)}
                />
              </div>
            );
          })}

          {/* Current time indicator - only show on today */}
          {(() => {
            const now = new Date();
            const isToday = 
              currentDate.getFullYear() === now.getFullYear() &&
              currentDate.getMonth() === now.getMonth() &&
              currentDate.getDate() === now.getDate();
            
            if (!isToday) return null;
            
            return (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-10 current-time-indicator"
                style={{ 
                  top: `${now.getHours() * HOUR_HEIGHT + (now.getMinutes() / 60) * HOUR_HEIGHT}px` 
                }}
              >
                <div className="w-16" />
                <div className="h-[3px] bg-red-500 flex-1 shadow-sm" />
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-sm animate-pulse" />
              </div>
            );
          })()}

          {/* Drag selection overlay */}
          {dragSelection && (() => {
            const minY = Math.min(dragSelection.startY, dragSelection.endY);
            const maxY = Math.max(dragSelection.startY, dragSelection.endY);
            
            // Calculate times from Y positions for overlap check
            const startTimeInfo = yToTime(minY);
            const endTimeInfo = yToTime(maxY);
            
            const actualStartHour = startTimeInfo.hour;
            const actualStartMin = startTimeInfo.minutes;
            const actualEndHour = endTimeInfo.hour;
            const actualEndMin = endTimeInfo.minutes;
            
            const startTime = new Date(currentDate);
            startTime.setHours(actualStartHour, actualStartMin, 0, 0);
            
            const endTime = new Date(currentDate);
            endTime.setHours(actualEndHour, actualEndMin, 0, 0);
            
            if (endTime <= startTime) {
              endTime.setDate(endTime.getDate() + 1);
            }
            
            const isOverlapping = hasOverlap(startTime, endTime);
            
            return (
              <div
                className={cn(
                  "absolute rounded-lg pointer-events-none transition-colors",
                  isMobile ? "left-12 right-2" : "left-16 right-4",
                  isOverlapping 
                    ? "bg-red-500/20 dark:bg-red-500/10 border-2 border-red-500 dark:border-red-400" 
                    : "bg-blue-500/30 dark:bg-blue-500/10 border-2 border-blue-500 dark:border-blue-400 border-solid"
                )}
                style={{
                  top: `${minY}px`,
                  height: `${maxY - minY}px`,
                }}
              >
                <div className={cn(
                  "px-3 py-1 text-sm font-medium",
                  isOverlapping ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"
                )}>
                  {formatTime(actualStartHour, actualStartMin)} - {formatTime(actualEndHour, actualEndMin)}
                  {isOverlapping && " (Occupied)"}
                </div>
              </div>
            );
          })()}

          {/* Ghost block for dragging */}
          {ghostBlock && (() => {
            const block = blocks.find(b => b.id === ghostBlock.id);
            if (!block) return null;
            
            return (
              <div
                className={cn(
                  "absolute rounded-lg border-2 border-solid pointer-events-none",
                  "bg-opacity-30 dark:bg-opacity-10",
                  isMobile ? "left-12 right-2" : "left-16 right-4"
                )}
                style={{
                  top: `${ghostBlock.startY}px`,
                  height: `${ghostBlock.height}px`,
                  borderColor: block.color || '#60A5FA',
                  backgroundColor: `${block.color || '#60A5FA'}30`,
                }}
              />
            );
          })()}
        </div>
      </ScrollArea>

      
      {/* Color Palette */}
      <ColorPalette
        isOpen={showColorPalette}
        position={colorPalettePosition}
        currentColor={selectedBlockForColor ? blocks.find(b => b.id === selectedBlockForColor)?.color : undefined}
        onSelectColor={(color) => {
          if (selectedBlockForColor && onUpdateColor) {
            onUpdateColor(selectedBlockForColor, color);
          }
        }}
        onClose={() => {
          setShowColorPalette(false);
          setSelectedBlockForColor(null);
        }}
      />

      {/* Context menu for creating events/tasks */}
      {showMenu && (
        <div
          className="absolute z-50 bg-background border rounded-lg shadow-lg p-2 min-w-[150px]"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            onClick={handleCreateEvent}
          >
            <Clock className="h-4 w-4" />
            Create Event
          </button>
          {isSpecialUser ? (
            <>
              <div className="border-t my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                TASK PRESETS
              </div>
              {TASK_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex items-center gap-3"
                  onClick={() => handleCreateTask(preset.title, preset.color, preset.emoji)}
                >
                  <span className="text-lg">{preset.emoji}</span>
                  <span>{preset.title}</span>
                  <div
                    className="ml-auto w-3 h-3 rounded-full"
                    style={{ backgroundColor: preset.color }}
                  />
                </button>
              ))}
              <div className="border-t my-1" />
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex items-center gap-3"
                onClick={() => handleCreateTask()}
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                Custom task
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors flex items-center gap-2"
              onClick={() => handleCreateTask()}
            >
              <CheckCircle2 className="h-4 w-4" />
              Create Task
            </button>
          )}
          <div className="border-t my-1" />
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-muted-foreground"
            onClick={() => {
              setShowMenu(false);
              setDragSelection(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}