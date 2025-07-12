'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon, CheckSquare, Trash2, Check, Circle, CheckCircle2, Coffee, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ColorPalette } from './color-palette';
import { useResponsive } from '@/hooks/useResponsive';

const HOUR_HEIGHT = 60; // Height of each hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

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
  const [dragStartY, setDragStartY] = useState(0);
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
  const { isMobile, isTablet } = useResponsive();
  const touchStartXRef = useRef<number | null>(null);

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
    const h = hour.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Handle mouse down to start drag selection
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
        // Parse times to check for overlap
        const [startHour, startMin] = dragSelection.startTime.split(':').map(Number);
        const [endHour, endMin] = dragSelection.endTime.split(':').map(Number);
        
        // Ensure start is before end
        let actualStartHour = startHour;
        let actualStartMin = startMin;
        let actualEndHour = endHour;
        let actualEndMin = endMin;
        
        if (dragSelection.endY < dragSelection.startY) {
          actualStartHour = endHour;
          actualStartMin = endMin;
          actualEndHour = startHour;
          actualEndMin = startMin;
        }
        
        const startTime = new Date(currentDate);
        startTime.setHours(actualStartHour, actualStartMin, 0, 0);
        
        const endTime = new Date(currentDate);
        endTime.setHours(actualEndHour, actualEndMin, 0, 0);
        
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }
        
        // Check for overlap
        if (!hasOverlap(startTime, endTime)) {
          // Store the selection data for menu handlers
          setMenuSelectionData({ startTime, endTime });
          
          // Position menu to the side of the selection
          const rect = gridRef.current!.getBoundingClientRect();
          const scrollTop = scrollRef.current?.scrollTop || 0;
          const selectionCenterY = rect.top + minY + (maxY - minY) / 2 - scrollTop;
          
          // Position to the right of the calendar, but ensure it's within viewport
          const menuX = Math.min(rect.right + 10, window.innerWidth - 200);
          const menuY = Math.min(Math.max(selectionCenterY - 50, 10), window.innerHeight - 120);
          
          setMenuPosition({ 
            x: menuX,
            y: menuY
          });
          setShowMenu(true);
          
          // Don't clear selection when showing menu
          return;
        }
      }
      setDragSelection(null);
    } else if (draggingBlock && ghostBlock && onUpdateBlock) {
      // Handle block drop
      const block = blocks.find(b => b.id === draggingBlock);
      if (block) {
        const time = yToTime(ghostBlock.startY);
        const duration = block.endTime.getTime() - block.startTime.getTime();
        
        const newStartTime = new Date(currentDate);
        newStartTime.setHours(time.hour, time.minutes, 0, 0);
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        if (!hasOverlap(newStartTime, newEndTime, draggingBlock)) {
          onUpdateBlock(draggingBlock, newStartTime, newEndTime);
        }
      }
      
      setDraggingBlock(null);
      setGhostBlock(null);
      setMouseOffsetY(0);
      onInteractionEnd?.();
    } else if (resizingBlock && onUpdateBlock) {
      // Handle resize end
      const block = blocks.find(b => b.id === resizingBlock.id);
      if (block && ghostBlock) {
        const deltaY = e.clientY - resizingBlock.initialMouseY;
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15; // Snap to 15 min
        
        const newEndTime = new Date(resizingBlock.initialEndTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + deltaMinutes);
        
        // Ensure minimum duration of 15 minutes
        const minEndTime = new Date(block.startTime);
        minEndTime.setMinutes(minEndTime.getMinutes() + 15);
        
        if (newEndTime > minEndTime && !hasOverlap(block.startTime, newEndTime, resizingBlock.id)) {
          onUpdateBlock(resizingBlock.id, block.startTime, newEndTime);
        }
      }
      
      setResizingBlock(null);
      setGhostBlock(null);
      onInteractionEnd?.();
    }
  }, [isDragging, dragSelection, draggingBlock, ghostBlock, blocks, currentDate, hasOverlap, onUpdateBlock, yToTime, onInteractionEnd, resizingBlock]);

  // Store the selection data for menu handlers
  const [menuSelectionData, setMenuSelectionData] = useState<{ startTime: Date; endTime: Date } | null>(null);

  // Handle menu item clicks
  const handleCreateEvent = () => {
    if (!menuSelectionData || !onCreateEvent) return;
    
    onCreateEvent(menuSelectionData.startTime, menuSelectionData.endTime);
    setShowMenu(false);
    setMenuSelectionData(null);
    setDragSelection(null);
  };

  const handleCreateTask = (title?: string, color?: string, icon?: string) => {
    if (!menuSelectionData || !onCreateTask) return;
    
    onCreateTask(menuSelectionData.startTime, menuSelectionData.endTime, title, color, icon);
    setShowMenu(false);
    setMenuSelectionData(null);
    setDragSelection(null);
  };

  // Task presets for specific user
  const TASK_PRESETS = [
    { title: 'Coding', emoji: '💻', color: '#3B82F6' }, // Blue
    { title: 'Research', emoji: '🔍', color: '#8B5CF6' }, // Purple
    { title: 'Break', emoji: '☕', color: '#10B981' }, // Green
    { title: 'Crypto', emoji: '🪙', color: '#F59E0B' }, // Amber
    { title: 'Food', emoji: '🍽️', color: '#EF4444' }, // Red
  ];

  const isSpecialUser = userEmail === 'samid@pockethunter.io';

  // Handle block drag start
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!gridRef.current) return;
    
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
    setDragStartY(startY);
    setMouseOffsetY(offset);
    setGhostBlock({ id: blockId, startY, height });
    onInteractionStart?.();
  }, [blocks, onInteractionStart]);

  // Handle resize start
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    setResizingBlock({
      id: blockId,
      initialEndTime: block.endTime,
      initialMouseY: e.clientY
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

  // Close menu on outside click
  useEffect(() => {
    if (showMenu) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.create-menu')) {
          setShowMenu(false);
          setDragSelection(null);
          setMenuSelectionData(null);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', handleClick);
      }, 100);
      
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

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
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
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
                      style={{ backgroundColor: currentEvent.color || '#3B82F6' }}
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
                    style={{ backgroundColor: currentEvent.color || '#3B82F6' }}
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
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
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
          className="relative select-none cursor-crosshair"
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

          {/* Drag selection overlay */}
          {dragSelection && (() => {
            const minY = Math.min(dragSelection.startY, dragSelection.endY);
            const maxY = Math.max(dragSelection.startY, dragSelection.endY);
            
            // Check if current selection overlaps
            const [startHour, startMin] = dragSelection.startTime.split(':').map(Number);
            const [endHour, endMin] = dragSelection.endTime.split(':').map(Number);
            
            let actualStartHour = startHour;
            let actualStartMin = startMin;
            let actualEndHour = endHour;
            let actualEndMin = endMin;
            
            if (dragSelection.endY < dragSelection.startY) {
              actualStartHour = endHour;
              actualStartMin = endMin;
              actualEndHour = startHour;
              actualEndMin = startMin;
            }
            
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
                    ? "bg-red-500/20 border-2 border-red-500" 
                    : "bg-blue-500/30 border-2 border-blue-500 border-dashed"
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
            
            let newStartTime: Date;
            let newEndTime: Date;
            let isValidDrop: boolean;
            
            if (resizingBlock && resizingBlock.id === ghostBlock.id) {
              // For resizing, the start time stays the same
              newStartTime = block.startTime;
              // Calculate new end time based on ghost block height
              const durationHours = ghostBlock.height / HOUR_HEIGHT;
              newEndTime = new Date(newStartTime.getTime() + durationHours * 60 * 60 * 1000);
              isValidDrop = !hasOverlap(newStartTime, newEndTime, ghostBlock.id);
            } else {
              // For dragging
              const time = yToTime(ghostBlock.startY);
              const duration = block.endTime.getTime() - block.startTime.getTime();
              newStartTime = new Date(currentDate);
              newStartTime.setHours(time.hour, time.minutes, 0, 0);
              newEndTime = new Date(newStartTime.getTime() + duration);
              isValidDrop = !hasOverlap(newStartTime, newEndTime, ghostBlock.id);
            }
            
            return (
              <div
                className={cn(
                  "absolute rounded-lg p-2 text-xs pointer-events-none transition-opacity",
                  isMobile ? "left-12 right-2" : "left-16 right-4",
                  "shadow-lg"
                )}
                style={{
                  top: `${ghostBlock.startY}px`,
                  height: `${ghostBlock.height}px`,
                  backgroundColor: block.color || '#3B82F6',
                  opacity: isValidDrop ? 0.8 : 0.4,
                  border: `2px solid ${isValidDrop ? 'rgba(255,255,255,0.8)' : '#ef4444'}`,
                }}
              >
                <div className="font-medium truncate text-white">{block.title}</div>
                <div className="text-xs text-white/80">
                  {format(newStartTime, 'h:mm a')} - {format(newEndTime, 'h:mm a')}
                </div>
                {!isValidDrop && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                      Occupied
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

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
            const isDragging = draggingBlock === block.id;
            const isResizing = resizingBlock?.id === block.id;
            const isHovered = hoveredBlockId === block.id;
            
            return (
              <div
                key={block.id}
                className={cn(
                  "calendar-block absolute rounded-lg p-2 text-xs text-white group",
                  isMobile ? "left-12 right-2" : "left-16 right-4",
                  isDragging ? "opacity-30" : "hover:shadow-lg transition-shadow",
                  isResizing ? "opacity-50" : "",
                  "cursor-grab active:cursor-grabbing"
                )}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(30, height)}px`, // Min height for visibility
                  backgroundColor: block.color || '#3B82F6',
                  opacity: block.isCompleted ? 0.6 : isDragging ? 0.3 : isResizing ? 0.5 : 1,
                }}
                onMouseDown={(e) => {
                  // Don't start drag if clicking on interactive elements
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input')) {
                    return;
                  }
                  handleBlockMouseDown(e, block.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedBlockForColor(block.id);
                  setColorPalettePosition({ x: e.clientX, y: e.clientY });
                  setShowColorPalette(true);
                  setShowMenu(false);
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
                >
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/40 group-hover/resize:bg-white/60 transition-colors" />
                </div>
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
        </div>
      </ScrollArea>

      {/* Create menu popup */}
      {showMenu && (
        <div
          className="create-menu fixed z-50 bg-card rounded-lg shadow-2xl border py-1"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
            <button
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex items-center gap-3"
              onClick={handleCreateEvent}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Create event
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
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex items-center gap-3"
                onClick={() => handleCreateTask()}
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                Create task (fixed time)
              </button>
            )}
        </div>
      )}
      
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
    </div>
  );
}