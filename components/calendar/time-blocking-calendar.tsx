'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SingleDayCalendarGrid } from './single-day-calendar-grid';
import { CurrentTimeIndicator } from './current-time-indicator';
import { TimeBlock } from './time-block';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import {
  pixelPositionToTime,
  roundToNearestSlot,
  addMinutes,
} from '@/lib/utils/time-blocks';
import { motion, AnimatePresence } from 'framer-motion';
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
import { TimeBlockError } from './time-block-error';

interface TimeBlockingCalendarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TimeBlockingCalendar({ isOpen, onToggle }: TimeBlockingCalendarProps) {
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

  // Navigate days
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Check if current date is today
  const isCurrentDay = isToday(currentDate);

  // Handle empty slot click (single vs double)
  const handleSlotClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore clicks on existing time blocks
    if ((e.target as HTMLElement).closest('.time-block')) return;
    
    const target = e.target as HTMLElement;
    const slotElement = target.closest('[data-slot-index]') as HTMLElement;
    
    if (!slotElement) return;
    
    const slotIndex = parseInt(slotElement.dataset.slotIndex || '0');
    
    // Calculate click position relative to the slot
    const rect = slotElement.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    // Convert to time
    const clickTime = pixelPositionToTime(slotIndex * 20 + relativeY, currentDate);
    const roundedTime = roundToNearestSlot(clickTime);
    
    // Handle single vs double click
    if (clickTimer) {
      // Double click - clear timer and create 1-hour block
      clearTimeout(clickTimer);
      setClickTimer(null);
      
      setNewBlockData({
        startTime: roundedTime,
        title: '',
        duration: 60, // 1 hour
      });
      setIsCreating(true);
    } else {
      // Single click - set timer
      const timer = setTimeout(() => {
        setClickTimer(null);
        setNewBlockData({
          startTime: roundedTime,
          title: '',
          duration: 30, // 30 minutes
        });
        setIsCreating(true);
      }, 250); // 250ms delay to detect double click
      
      setClickTimer(timer);
    }
  }, [currentDate, clickTimer]);

  // Handle mouse move for ghost block preview
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only show ghost block when not creating and not over existing blocks
    if (isCreating || (e.target as HTMLElement).closest('.time-block')) {
      setGhostBlock(null);
      return;
    }
    
    const target = e.target as HTMLElement;
    const slotElement = target.closest('[data-slot-index]') as HTMLElement;
    
    if (!slotElement) {
      setGhostBlock(null);
      return;
    }
    
    const slotIndex = parseInt(slotElement.dataset.slotIndex || '0');
    
    // Calculate position
    const rect = slotElement.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    const clickTime = pixelPositionToTime(slotIndex * 20 + relativeY, currentDate);
    const startTime = roundToNearestSlot(clickTime);
    const endTime = addMinutes(startTime, 30);
    
    setGhostBlock({ startTime, endTime });
  }, [currentDate, isCreating]);

  const handleMouseLeave = useCallback(() => {
    setGhostBlock(null);
  }, []);

  // Handle block creation
  const handleCreateBlock = async () => {
    if (!newBlockData || !newBlockData.title.trim() || isSubmitting) return;

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
    if (!isOpen) return;

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
  }, [isOpen]);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="fixed right-0 top-0 h-screen w-[400px] bg-background border-l shadow-xl z-40"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Time Blocks</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Day navigation */}
              <div className="flex items-center justify-between">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousDay}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </motion.div>

                <motion.div 
                  className="text-center"
                  key={currentDate.toISOString()}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <AnimatePresence>
                    {!isCurrentDay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          variant="link"
                          size="sm"
                          onClick={goToToday}
                          className="h-auto p-0 text-xs"
                        >
                          Go to today
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextDay}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>

              {/* Stats */}
              <motion.div 
                className="mt-4 rounded-lg bg-muted p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-xs text-muted-foreground">Total Focused Time</div>
                <div className="text-lg font-semibold">
                  {totalFocusedHours}h {remainingMinutes}m
                </div>
              </motion.div>
            </div>

            {/* Calendar Grid */}
            <div 
              className="flex-1 relative overflow-hidden" 
              onClick={handleSlotClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <AnimatePresence>
                {isLoading && (
                  <motion.div 
                    className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                    >
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </motion.div>
                  </motion.div>
                )}
                
                {error && !isLoading && (
                  <TimeBlockError 
                    message={error} 
                    onRetry={refetch} 
                  />
                )}
              </AnimatePresence>
              <SingleDayCalendarGrid 
                currentDate={currentDate}
                onSlotClick={handleSlotClick}
                onSlotMouseMove={handleMouseMove}
                onSlotMouseLeave={handleMouseLeave}
              >
                {/* Current time indicator */}
                {isCurrentDay && <CurrentTimeIndicator currentDate={currentDate} />}

                {/* Time blocks for current day only */}
                {blocks
                  .filter(block => isSameDay(block.startTime, currentDate))
                  .map((block) => (
                    <TimeBlock
                      key={block.id}
                      id={block.id}
                      title={block.title}
                      startTime={block.startTime}
                      endTime={block.endTime}
                      color={block.color}
                      isCompleted={block.isCompleted}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                    />
                  ))}

                {/* Ghost block preview */}
                <AnimatePresence>
                  {ghostBlock && isSameDay(ghostBlock.startTime, currentDate) && (
                    <TimeBlock
                      id="ghost"
                      title="Click to create 30min block\nDouble-click for 1hr block"
                      startTime={ghostBlock.startTime}
                      endTime={ghostBlock.endTime}
                      color="#94A3B8"
                      isCompleted={false}
                      isGhost
                    />
                  )}
                </AnimatePresence>
              </SingleDayCalendarGrid>
            </div>
          </div>

          {/* Create block dialog */}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Time Block</DialogTitle>
                <DialogDescription>
                  Add a new {newBlockData?.duration === 60 ? '1-hour' : '30-minute'} time block for{' '}
                  {newBlockData && format(newBlockData.startTime, 'EEEE, MMM d')} at{' '}
                  {newBlockData && format(newBlockData.startTime, 'h:mm a')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What will you work on?"
                    value={newBlockData?.title || ''}
                    onChange={(e) =>
                      setNewBlockData((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateBlock();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handleCreateBlock} 
                    disabled={!newBlockData?.title.trim() || isSubmitting}
                    className="relative"
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="create"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Block
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}