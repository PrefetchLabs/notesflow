'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SingleDayCalendarGrid } from '@/components/calendar/single-day-calendar-grid';
import { CurrentTimeIndicator } from '@/components/calendar/current-time-indicator';
import { TimeBlock } from '@/components/calendar/time-block';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import {
  pixelPositionToTime,
  roundToNearestSlot,
  addMinutes,
} from '@/lib/utils/time-blocks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TimeBlockError } from '@/components/calendar/time-block-error';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarSidebarProps {
  onToggle: () => void;
}

export function CalendarSidebar({ onToggle }: CalendarSidebarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBlockData, setNewBlockData] = useState<{
    startTime: Date;
    title: string;
    duration: number; // minutes
  } | null>(null);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [ghostBlock, setGhostBlock] = useState<{
    startTime: Date;
    endTime: Date;
  } | null>(null);

  const { blocks, isLoading, error, createBlock, updateBlock, deleteBlock, refetch } = useTimeBlocks(currentDate);

  const isCurrentDay = isToday(currentDate);

  const goToPreviousDay = useCallback(() => {
    setCurrentDate(prev => subDays(prev, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setCurrentDate(prev => addDays(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleTimeSlotClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedTime = pixelPositionToTime(y);
    const roundedTime = roundToNearestSlot(clickedTime);

    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Set up single click timer
    const timer = setTimeout(() => {
      setNewBlockData({
        startTime: roundedTime,
        title: '',
        duration: 60, // Default 1 hour
      });
      setIsCreating(true);
    }, 250);

    setClickTimer(timer);
  }, [clickTimer]);

  const handleTimeSlotDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Clear single click timer
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedTime = pixelPositionToTime(y);
    const roundedTime = roundToNearestSlot(clickedTime);

    // Default 30 minute block for double-click
    setNewBlockData({
      startTime: roundedTime,
      title: '',
      duration: 30,
    });
    setIsCreating(true);
  }, [clickTimer]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const currentTime = pixelPositionToTime(y);
    const roundedTime = roundToNearestSlot(currentTime);

    setGhostBlock({
      startTime: roundedTime,
      endTime: addMinutes(roundedTime, 30),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGhostBlock(null);
  }, []);

  const handleCreateBlock = async () => {
    if (!newBlockData || !newBlockData.title.trim()) return;

    setIsSubmitting(true);
    
    try {
      const endTime = addMinutes(newBlockData.startTime, newBlockData.duration);
      
      await createBlock({
        title: newBlockData.title,
        startTime: newBlockData.startTime,
        endTime,
        color: '#3B82F6',
      });

      setIsCreating(false);
      setNewBlockData(null);
    } catch (error) {
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
    };
  }, [clickTimer]);

  // Listen for calendar navigation keyboard shortcuts
  useEffect(() => {
    const handleToday = () => goToToday();
    const handlePrevDay = () => goToPreviousDay();
    const handleNextDay = () => goToNextDay();

    window.addEventListener('calendar-today', handleToday);
    window.addEventListener('calendar-prev-day', handlePrevDay);
    window.addEventListener('calendar-next-day', handleNextDay);

    return () => {
      window.removeEventListener('calendar-today', handleToday);
      window.removeEventListener('calendar-prev-day', handlePrevDay);
      window.removeEventListener('calendar-next-day', handleNextDay);
    };
  }, [goToToday, goToPreviousDay, goToNextDay]);

  // Calculate total focused time
  const totalFocusedMinutes = blocks.reduce((total, block) => {
    if (block.isCompleted) {
      const duration = (block.endTime.getTime() - block.startTime.getTime()) / 1000 / 60;
      return total + duration;
    }
    return total;
  }, 0);

  const totalFocusedHours = Math.floor(totalFocusedMinutes / 60);
  const remainingMinutes = Math.round(totalFocusedMinutes % 60);

  return (
    <aside className="calendar-sidebar relative flex h-full flex-col border-l bg-background w-[280px]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Time Blocks</h2>
          
          {/* Hide Calendar Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className={cn(
                    'absolute -left-4 top-6 z-10 h-8 w-8 rounded-full border bg-background shadow-sm',
                    'hover:bg-accent hover:shadow-md',
                    'transition-shadow duration-200'
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Hide calendar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Day navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousDay}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <div className="text-sm font-medium">
              {format(currentDate, 'EEEE')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(currentDate, 'MMM d, yyyy')}
            </div>
            {!isCurrentDay && (
              <Button
                variant="link"
                size="sm"
                onClick={goToToday}
                className="h-auto p-0 text-xs mt-1"
              >
                Go to today
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextDay}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-4 rounded-lg bg-muted p-3">
          <div className="text-xs text-muted-foreground">Total focus time</div>
          <div className="text-sm font-medium">
            {totalFocusedHours > 0 && `${totalFocusedHours}h `}
            {remainingMinutes > 0 && `${remainingMinutes}m`}
            {totalFocusedHours === 0 && remainingMinutes === 0 && '0m'}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 pb-20">
          {error && <TimeBlockError error={error} onRetry={refetch} />}
          
          {!error && (
            <div className="relative h-[1440px]"> {/* 24 hours * 60px per hour */}
              <SingleDayCalendarGrid />
              
              {/* Time blocks */}
              {blocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                />
              ))}

              {/* Ghost block on hover */}
              {ghostBlock && !blocks.some(block => {
                const ghostStart = ghostBlock.startTime.getTime();
                const ghostEnd = ghostBlock.endTime.getTime();
                const blockStart = block.startTime.getTime();
                const blockEnd = block.endTime.getTime();
                return (ghostStart < blockEnd && ghostEnd > blockStart);
              }) && (
                <div
                  className="absolute left-16 right-4 bg-primary/10 border border-primary/20 rounded-md pointer-events-none"
                  style={{
                    top: `${(ghostBlock.startTime.getHours() * 60 + ghostBlock.startTime.getMinutes()) * 1}px`,
                    height: `${((ghostBlock.endTime.getTime() - ghostBlock.startTime.getTime()) / 1000 / 60) * 1}px`,
                  }}
                />
              )}

              {/* Click area for creating new blocks */}
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={handleTimeSlotClick}
                onDoubleClick={handleTimeSlotDoubleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />

              {/* Current time indicator */}
              {isCurrentDay && <CurrentTimeIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create block dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Time Block</DialogTitle>
            <DialogDescription>
              Schedule a focused work session for {newBlockData && format(newBlockData.startTime, 'h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">What will you work on?</Label>
              <Input
                id="title"
                placeholder="e.g., Write project proposal"
                value={newBlockData?.title || ''}
                onChange={(e) => setNewBlockData(prev => prev ? { ...prev, title: e.target.value } : null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBlockData?.title.trim()) {
                    handleCreateBlock();
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <select
                id="duration"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newBlockData?.duration || 60}
                onChange={(e) => setNewBlockData(prev => prev ? { ...prev, duration: parseInt(e.target.value) } : null)}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBlock} 
              disabled={!newBlockData?.title.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}