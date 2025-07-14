'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, Circle, CheckCircle2, Coffee, Clock } from 'lucide-react';
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



export function MinimalCalendar({ 
  currentDate, 
  onDateChange, 
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
          className="relative select-none"
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px`, minHeight: '100%' }}
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
                  "calendar-block absolute rounded-lg p-2 text-xs text-white group",
                  isMobile ? "left-12 right-2" : "left-16 right-4",
                  "hover:shadow-lg transition-shadow"
                )}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(30, height)}px`, // Min height for visibility
                  backgroundColor: block.color || '#3B82F6',
                  opacity: block.isCompleted ? 0.6 : 1,
                }}
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