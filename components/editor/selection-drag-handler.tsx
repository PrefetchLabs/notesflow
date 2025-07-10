'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from '@radix-ui/react-portal';
import { useDragDrop } from '@/contexts/drag-drop-context';

interface SelectionDragHandlerProps {
  selection: {
    text: string;
    bounds?: DOMRect;
  } | null;
  onDragStart: (event: React.DragEvent, text: string) => void;
  className?: string;
}

export function SelectionDragHandler({ 
  selection, 
  onDragStart,
  className 
}: SelectionDragHandlerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const handlerRef = useRef<HTMLDivElement>(null);
  const { startDrag, endDrag } = useDragDrop();

  // Update position when selection changes
  useEffect(() => {
    if (selection?.bounds) {
      // Position the handler to the right of the selection
      const x = selection.bounds.right + 8;
      const y = selection.bounds.top + (selection.bounds.height / 2) - 16; // Center vertically
      
      // Ensure the handler stays within viewport
      const maxX = window.innerWidth - 40;
      const adjustedX = Math.min(x, maxX);
      
      setPosition({ x: adjustedX, y });
    }
  }, [selection]);

  const handleDragStart = (e: React.DragEvent) => {
    if (!selection) return;

    setIsDragging(true);
    
    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', selection.text);
    e.dataTransfer.setData('application/x-notesflow-drag', JSON.stringify({
      type: 'text-selection',
      text: selection.text,
      source: 'editor',
    }));

    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed p-2 bg-background border rounded-md shadow-lg max-w-xs';
    dragImage.style.cssText = 'position: fixed; top: -1000px; left: -1000px; z-index: -1;';
    dragImage.textContent = selection.text.length > 50 
      ? selection.text.substring(0, 50) + '...' 
      : selection.text;
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    // Start drag in context
    startDrag(selection.text, {
      type: 'text-selection',
      source: 'editor',
    });

    onDragStart(e, selection.text);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    endDrag();
  };

  if (!selection?.bounds) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          ref={handlerRef}
          className={cn(
            'fixed z-50 flex items-center justify-center',
            'w-8 h-8 rounded-md',
            'bg-primary/10 hover:bg-primary/20',
            'border border-primary/20',
            'cursor-grab active:cursor-grabbing',
            'transition-colors duration-200',
            isDragging && 'opacity-50',
            className
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title="Drag to calendar"
        >
          <div className="relative">
            <GripVertical className="w-4 h-4 text-primary" />
            <motion.div
              className="absolute -bottom-1 -right-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Calendar className="w-3 h-3 text-primary" />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Tooltip */}
      <AnimatePresence>
        {!isDragging && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${position.x + 40}px`,
              top: `${position.y - 4}px`,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay: 0.5 }}
          >
            <div className="px-2 py-1 text-xs bg-popover text-popover-foreground rounded-md shadow-md border">
              Drag to calendar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}