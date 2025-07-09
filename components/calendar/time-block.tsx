'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, GripVertical } from 'lucide-react';
import {
  timeToSlotIndex,
  durationToSlots,
  SLOT_HEIGHT_PX,
  roundToNearestSlot,
  slotIndexToTime,
} from '@/lib/utils/time-blocks';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeBlockProps {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color?: string;
  isCompleted?: boolean;
  onUpdate?: (id: string, updates: { startTime?: Date; endTime?: Date; isCompleted?: boolean }) => void;
  onDelete?: (id: string) => void;
  isGhost?: boolean;
}

export function TimeBlock({
  id,
  title,
  startTime,
  endTime,
  color = '#3B82F6',
  isCompleted = false,
  onUpdate,
  onDelete,
  isGhost = false,
}: TimeBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-top' | 'resize-bottom' | null>(null);
  const [localStartTime, setLocalStartTime] = useState(startTime);
  const [localEndTime, setLocalEndTime] = useState(endTime);
  const blockRef = useRef<HTMLDivElement>(null);

  // Calculate position and size
  const startSlot = timeToSlotIndex(localStartTime);
  const duration = durationToSlots(localStartTime, localEndTime);
  const topPosition = startSlot * SLOT_HEIGHT_PX;
  const height = duration * SLOT_HEIGHT_PX;

  // Handle mouse down for drag/resize
  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-top' | 'resize-bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    
    // Add haptic feedback simulation
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    const startY = e.clientY;
    const initialStartTime = new Date(localStartTime);
    const initialEndTime = new Date(localEndTime);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const slotDelta = Math.round(deltaY / SLOT_HEIGHT_PX);

      if (type === 'move') {
        // Move entire block
        const newStartSlot = timeToSlotIndex(initialStartTime) + slotDelta;
        const newEndSlot = timeToSlotIndex(initialEndTime) + slotDelta;
        
        const newStartTime = slotIndexToTime(newStartSlot, initialStartTime);
        const newEndTime = slotIndexToTime(newEndSlot, initialEndTime);
        
        setLocalStartTime(newStartTime);
        setLocalEndTime(newEndTime);
      } else if (type === 'resize-top') {
        // Resize from top
        const newStartSlot = timeToSlotIndex(initialStartTime) + slotDelta;
        const endSlot = timeToSlotIndex(localEndTime);
        
        // Ensure minimum duration of 1 slot
        if (newStartSlot < endSlot) {
          const newStartTime = slotIndexToTime(newStartSlot, initialStartTime);
          setLocalStartTime(newStartTime);
        }
      } else if (type === 'resize-bottom') {
        // Resize from bottom
        const startSlot = timeToSlotIndex(localStartTime);
        const newEndSlot = timeToSlotIndex(initialEndTime) + slotDelta;
        
        // Ensure minimum duration of 1 slot
        if (newEndSlot > startSlot) {
          const newEndTime = slotIndexToTime(newEndSlot, initialEndTime);
          setLocalEndTime(newEndTime);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      
      // Round to nearest slot
      const roundedStartTime = roundToNearestSlot(localStartTime);
      const roundedEndTime = roundToNearestSlot(localEndTime);
      
      setLocalStartTime(roundedStartTime);
      setLocalEndTime(roundedEndTime);
      
      // Update parent component
      if (onUpdate) {
        onUpdate(id, {
          startTime: roundedStartTime,
          endTime: roundedEndTime,
        });
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle completion toggle
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      onUpdate(id, { isCompleted: !isCompleted });
      
      // Add haptic feedback
      if ('vibrate' in navigator && !isCompleted) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  };

  return (
    <motion.div
      ref={blockRef}
      className={cn(
        "time-block absolute rounded-md shadow-sm border select-none overflow-hidden",
        !isGhost && "cursor-move hover:shadow-lg transition-all duration-200",
        isDragging && "opacity-90 shadow-xl z-50 scale-[1.02]",
        isCompleted && "opacity-70",
        isGhost && "opacity-40 pointer-events-none border-dashed bg-muted"
      )}
      style={{
        position: 'absolute',
        top: `${topPosition}px`,
        height: `${height}px`,
        backgroundColor: isGhost ? 'transparent' : (isCompleted ? '#86EFAC' : color),
        borderColor: isGhost ? '#94A3B8' : (isCompleted ? '#4ADE80' : color),
        left: '8px',
        right: '8px',
        pointerEvents: 'auto',
      }}
      onMouseDown={!isGhost ? (e) => handleMouseDown(e, 'move') : undefined}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ 
        opacity: isGhost ? 0.4 : 1, 
        scale: isDragging ? 1.02 : 1,
        y: 0
      }}
      whileHover={!isGhost && !isDragging ? { 
        scale: 1.01,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)" 
      } : {}}
      exit={{ 
        opacity: 0, 
        scale: 0.8, 
        y: -10,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        scale: { duration: 0.15 }
      }}
    >
      {/* Resize handles - only show for non-ghost blocks */}
      {!isGhost && (
        <>
          <motion.div
            className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize group"
            onMouseDown={(e) => handleMouseDown(e, 'resize-top')}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <motion.div 
              className="absolute inset-x-0 top-0 h-1"
              initial={{ backgroundColor: "rgba(255, 255, 255, 0)" }}
              whileHover={{ 
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                height: "2px"
              }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
          
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize group"
            onMouseDown={(e) => handleMouseDown(e, 'resize-bottom')}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <motion.div 
              className="absolute inset-x-0 bottom-0 h-1"
              initial={{ backgroundColor: "rgba(255, 255, 255, 0)" }}
              whileHover={{ 
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                height: "2px"
              }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        </>
      )}

      {/* Content */}
      <div className="p-2 h-full flex flex-col relative">
        {/* Drag handle indicator */}
        {!isGhost && !isDragging && height > 60 && (
          <div className="absolute left-1/2 top-1 -translate-x-1/2 opacity-0 hover:opacity-30 transition-opacity">
            <GripVertical className="h-3 w-3 text-white" />
          </div>
        )}
        
        <div className="flex items-start justify-between gap-1">
          <h4 className={cn(
            "text-xs font-medium line-clamp-2 flex-1",
            isGhost ? "text-muted-foreground text-center w-full" : "text-white",
            isCompleted && "line-through decoration-2"
          )}>
            {isGhost && height > 60 ? title.split('\n').map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            )) : title}
          </h4>
          {!isGhost && (
            <motion.button
              onClick={handleToggleComplete}
              className={cn(
                "w-4 h-4 rounded-sm border-2 border-white/60 flex-shrink-0 relative overflow-hidden",
                isCompleted && "bg-white border-white"
              )}
              whileHover={{ scale: 1.1, borderColor: "rgba(255, 255, 255, 1)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <AnimatePresence>
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30,
                      rotate: { duration: 0.3 }
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
        
        {/* Show time if block is tall enough */}
        {height > 40 && !isGhost && (
          <div className="text-[10px] text-white/70 mt-auto">
            {localStartTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - 
            {localEndTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Drag feedback overlay */}
      {isDragging && (
        <motion.div 
          className="absolute inset-0 bg-black/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </motion.div>
  );
}