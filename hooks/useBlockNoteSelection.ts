import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockNoteEditor } from '@blocknote/core';
import { debounce } from '@/lib/utils';

interface SelectionData {
  text: string;
  startPos: number;
  endPos: number;
  blocks: any[];
  anchorBlock?: any;
  focusBlock?: any;
  bounds?: DOMRect;
}

interface UseBlockNoteSelectionOptions {
  editor: BlockNoteEditor | null;
  enabled?: boolean;
  debounceMs?: number;
}

export function useBlockNoteSelection({
  editor,
  enabled = true,
  debounceMs = 100,
}: UseBlockNoteSelectionOptions) {
  const [selection, setSelection] = useState<SelectionData | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionRef = useRef<SelectionData | null>(null);

  // Get selected text from the editor
  const getSelectedText = useCallback(() => {
    if (!editor) return null;

    try {
      const { view } = editor._tiptapEditor;
      const { from, to } = view.state.selection;
      
      if (from === to) return null; // No selection

      const text = view.state.doc.textBetween(from, to, ' ');
      if (!text.trim()) return null;

      // Get selection bounds
      const domSelection = window.getSelection();
      let bounds: DOMRect | undefined;
      
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        bounds = range.getBoundingClientRect();
      }

      // Get the blocks that contain the selection
      const blocks: any[] = [];
      const startBlock = editor.getTextCursorPosition().block;
      
      // For now, we'll just track the current block
      // In a more complex implementation, we'd traverse all blocks in the selection
      if (startBlock) {
        blocks.push(startBlock);
      }

      return {
        text,
        startPos: from,
        endPos: to,
        blocks,
        anchorBlock: startBlock,
        focusBlock: startBlock, // For single block selections
        bounds,
      };
    } catch (error) {
      // [REMOVED_CONSOLE]
      return null;
    }
  }, [editor]);

  // Debounced selection handler
  const handleSelectionChange = useCallback(
    debounce(() => {
      if (!enabled || !editor) return;

      const newSelection = getSelectedText();
      
      // Only update if selection has actually changed
      if (JSON.stringify(newSelection) !== JSON.stringify(selectionRef.current)) {
        selectionRef.current = newSelection;
        setSelection(newSelection);
        setIsSelecting(!!newSelection);
      }
    }, debounceMs),
    [enabled, editor, getSelectedText, debounceMs]
  );

  // Set up selection change listener
  useEffect(() => {
    if (!editor || !enabled) return;

    const { view } = editor._tiptapEditor;

    // Listen for selection changes
    const handleUpdate = () => {
      handleSelectionChange();
    };

    // Add event listeners
    editor._tiptapEditor.on('selectionUpdate', handleUpdate);
    editor._tiptapEditor.on('update', handleUpdate);

    // Also listen for native selection changes for better responsiveness
    const handleDocumentSelection = () => {
      handleSelectionChange();
    };

    document.addEventListener('selectionchange', handleDocumentSelection);

    // Initial check
    handleSelectionChange();

    return () => {
      editor._tiptapEditor.off('selectionUpdate', handleUpdate);
      editor._tiptapEditor.off('update', handleUpdate);
      document.removeEventListener('selectionchange', handleDocumentSelection);
    };
  }, [editor, enabled, handleSelectionChange]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    selectionRef.current = null;
    
    // Clear browser selection
    const domSelection = window.getSelection();
    if (domSelection) {
      domSelection.removeAllRanges();
    }
  }, []);

  // Get selection position relative to viewport
  const getSelectionPosition = useCallback(() => {
    if (!selection?.bounds) return null;

    return {
      top: selection.bounds.top,
      left: selection.bounds.left,
      bottom: selection.bounds.bottom,
      right: selection.bounds.right,
      width: selection.bounds.width,
      height: selection.bounds.height,
      centerX: selection.bounds.left + selection.bounds.width / 2,
      centerY: selection.bounds.top + selection.bounds.height / 2,
    };
  }, [selection]);

  // Check if position is within selection bounds
  const isPositionInSelection = useCallback(
    (x: number, y: number) => {
      if (!selection?.bounds) return false;

      return (
        x >= selection.bounds.left &&
        x <= selection.bounds.right &&
        y >= selection.bounds.top &&
        y <= selection.bounds.bottom
      );
    },
    [selection]
  );

  return {
    selection,
    isSelecting,
    clearSelection,
    getSelectionPosition,
    isPositionInSelection,
    // Expose for testing
    getSelectedText,
  };
}