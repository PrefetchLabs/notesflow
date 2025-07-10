'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface DragDropContextType {
  // Drag state
  isDragging: boolean;
  draggedText: string | null;
  draggedMetadata: any;
  
  // Drag handlers
  startDrag: (text: string, metadata?: any) => void;
  endDrag: () => void;
  
  // Drop zone registration
  registerDropZone: (id: string, handler: (text: string, metadata: any) => void) => void;
  unregisterDropZone: (id: string) => void;
  
  // Drop handling
  handleDrop: (dropZoneId: string) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedText, setDraggedText] = useState<string | null>(null);
  const [draggedMetadata, setDraggedMetadata] = useState<any>(null);
  const [dropZoneHandlers] = useState(new Map<string, (text: string, metadata: any) => void>());

  const startDrag = useCallback((text: string, metadata?: any) => {
    console.log('[DragDropContext] Starting drag:', { text, metadata });
    setIsDragging(true);
    setDraggedText(text);
    setDraggedMetadata(metadata || {});
  }, []);

  const endDrag = useCallback(() => {
    console.log('[DragDropContext] Ending drag');
    setIsDragging(false);
    setDraggedText(null);
    setDraggedMetadata(null);
  }, []);

  const registerDropZone = useCallback((id: string, handler: (text: string, metadata: any) => void) => {
    console.log('[DragDropContext] Registering drop zone:', id);
    dropZoneHandlers.set(id, handler);
  }, [dropZoneHandlers]);

  const unregisterDropZone = useCallback((id: string) => {
    console.log('[DragDropContext] Unregistering drop zone:', id);
    dropZoneHandlers.delete(id);
  }, [dropZoneHandlers]);

  const handleDrop = useCallback((dropZoneId: string) => {
    if (!draggedText) return;
    
    const handler = dropZoneHandlers.get(dropZoneId);
    if (handler) {
      console.log('[DragDropContext] Handling drop in zone:', dropZoneId);
      handler(draggedText, draggedMetadata);
    }
    
    endDrag();
  }, [draggedText, draggedMetadata, dropZoneHandlers, endDrag]);

  return (
    <DragDropContext.Provider
      value={{
        isDragging,
        draggedText,
        draggedMetadata,
        startDrag,
        endDrag,
        registerDropZone,
        unregisterDropZone,
        handleDrop,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}