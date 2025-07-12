'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon, CheckSquare, Trash2, Check, Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const HOUR_HEIGHT = 60; // Height of each hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

interface MinimalCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent?: (startTime: Date, endTime: Date) => void;
  onCreateTask?: (startTime: Date, endTime: Date) => void;
  onUpdateBlock?: (id: string, startTime: Date, endTime: Date) => void;
  onDeleteBlock?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onRenameBlock?: (id: string, newTitle: string) => void;
  blocks?: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
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
  blocks = []
}: MinimalCalendarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [mouseOffsetY, setMouseOffsetY] = useState(0);
  const [ghostBlock, setGhostBlock] = useState<GhostBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    
    const rect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    const y = e.clientY - rect.top + scrollTop;
    
    const time = yToTime(y);
    const snappedY = timeToY(time.hour, time.minutes);
    const startTime = formatTime(time.hour, time.minutes);
    
    setIsDragging(true);
    setDragSelection({
      startY: snappedY,
      endY: snappedY,
      startTime,
      endTime: startTime
    });
  }, [yToTime, timeToY]);

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
    }
  }, [isDragging, dragSelection, draggingBlock, ghostBlock, mouseOffsetY, blocks, yToTime, timeToY]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragSelection) {
      setIsDragging(false);
      
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
    }
  }, [isDragging, dragSelection, draggingBlock, ghostBlock, blocks, currentDate, hasOverlap, onUpdateBlock, yToTime]);

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

  const handleCreateTask = () => {
    if (!menuSelectionData || !onCreateTask) return;
    
    onCreateTask(menuSelectionData.startTime, menuSelectionData.endTime);
    setShowMenu(false);
    setMenuSelectionData(null);
    setDragSelection(null);
  };

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
  }, [blocks]);

  // Handle double click to edit block title
  const handleBlockDoubleClick = useCallback((e: React.MouseEvent, block: { id: string; title: string }) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingBlockId(block.id);
    setEditingTitle(block.title);
  }, []);

  // Handle title edit submit
  const handleTitleSubmit = useCallback((blockId: string) => {
    if (onRenameBlock && editingTitle.trim()) {
      onRenameBlock(blockId, editingTitle.trim());
    }
    setEditingBlockId(null);
    setEditingTitle('');
  }, [onRenameBlock, editingTitle]);

  // Handle checkbox click for tasks
  const handleCheckboxClick = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
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
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Calculate scroll position to center current time in view
      const scrollPosition = (currentHour * HOUR_HEIGHT + (currentMinutes / 60) * HOUR_HEIGHT) - (window.innerHeight / 3);
      
      // Use setTimeout to ensure the scroll happens after render
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [currentDate]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            Today<br />
            <span className="text-muted-foreground">AEST</span>
          </div>
          <div className="text-sm font-medium">
            {format(currentDate, 'EEE MMM d')}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDateChange(new Date(currentDate.getTime() - 86400000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDateChange(new Date(currentDate.getTime() + 86400000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <ScrollArea className="flex-1 overflow-hidden" ref={scrollRef}>
        <div 
          ref={gridRef}
          className="relative select-none cursor-crosshair"
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px`, minHeight: '100%' }}
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background click area */}
          <div className="absolute inset-0 left-16" />
          
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex pointer-events-none"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-16 flex-shrink-0 text-right pr-3 pt-2">
                <span className="text-xs text-muted-foreground">
                  {hour} {hour < 12 ? 'AM' : 'PM'}
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
                  "absolute left-16 right-4 rounded-lg pointer-events-none transition-colors",
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
            
            const time = yToTime(ghostBlock.startY);
            const duration = block.endTime.getTime() - block.startTime.getTime();
            const newStartTime = new Date(currentDate);
            newStartTime.setHours(time.hour, time.minutes, 0, 0);
            const newEndTime = new Date(newStartTime.getTime() + duration);
            
            const isValidDrop = !hasOverlap(newStartTime, newEndTime, ghostBlock.id);
            
            return (
              <div
                className={cn(
                  "absolute left-16 right-4 rounded-lg p-2 text-xs pointer-events-none transition-opacity",
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
                  {format(newStartTime, 'HH:mm')} - {format(newEndTime, 'HH:mm')}
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
          {blocks.map((block) => {
            const startHour = block.startTime.getHours();
            const startMinutes = block.startTime.getMinutes();
            const endHour = block.endTime.getHours();
            const endMinutes = block.endTime.getMinutes();
            
            const top = startHour * HOUR_HEIGHT + (startMinutes / 60) * HOUR_HEIGHT;
            const height = (endHour - startHour) * HOUR_HEIGHT + ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
            const isDragging = draggingBlock === block.id;
            const isHovered = hoveredBlockId === block.id;
            
            return (
              <div
                key={block.id}
                className={cn(
                  "calendar-block absolute left-16 right-4 rounded-lg p-2 text-xs text-white group",
                  isDragging ? "opacity-30" : "hover:shadow-lg transition-shadow",
                  "cursor-grab active:cursor-grabbing"
                )}
                style={{
                  top: `${top}px`,
                  height: `${Math.max(30, height)}px`, // Min height for visibility
                  backgroundColor: block.color || '#3B82F6',
                  opacity: block.isCompleted ? 0.6 : isDragging ? 0.3 : 1,
                }}
                onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
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
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-black/30 rounded px-1 py-0 text-white text-xs font-medium outline-none ring-1 ring-white/30 focus:ring-white/50"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className={cn(
                            "font-medium truncate cursor-text",
                            block.isCompleted && "line-through opacity-75"
                          )}
                          onDoubleClick={(e) => handleBlockDoubleClick(e, block)}
                        >
                          {block.title}
                        </div>
                      )}
                      <div className="text-xs opacity-80">
                        {format(block.startTime, 'HH:mm')} - {format(block.endTime, 'HH:mm')}
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
            <button
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-accent flex items-center gap-3"
              onClick={handleCreateTask}
            >
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              Create task (fixed time)
            </button>
        </div>
      )}
    </div>
  );
}