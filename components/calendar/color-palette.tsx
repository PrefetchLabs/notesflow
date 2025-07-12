import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ColorPaletteProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelectColor: (color: string) => void;
  onClose: () => void;
  currentColor?: string;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

export function ColorPalette({ 
  isOpen, 
  position, 
  onSelectColor, 
  onClose,
  currentColor 
}: ColorPaletteProps) {
  React.useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.color-palette')) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="color-palette fixed z-50 bg-background border rounded-lg shadow-lg p-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "w-8 h-8 rounded-md transition-all hover:scale-110",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                  currentColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                )}
                style={{ 
                  backgroundColor: color.value,
                  focusRingColor: color.value 
                }}
                onClick={() => {
                  onSelectColor(color.value);
                  onClose();
                }}
                title={color.name}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}