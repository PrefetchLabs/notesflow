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
  { name: 'Blue', value: '#60A5FA' },
  { name: 'Green', value: '#4ADE80' },
  { name: 'Purple', value: '#A78BFA' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Orange', value: '#FB923C' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Red', value: '#F87171' },
  { name: 'Gray', value: '#9CA3AF' },
  { name: 'Indigo', value: '#818CF8' },
  { name: 'Teal', value: '#2DD4BF' },
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
          className="color-palette fixed z-50 bg-background border rounded-md shadow-lg p-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="grid grid-cols-5 gap-0.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "w-5 h-5 rounded transition-all hover:scale-110",
                  "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-background",
                  currentColor === color.value && "ring-1 ring-offset-1 ring-offset-background ring-foreground"
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