import { useEffect, useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

interface NavigableItem {
  id: string;
  type: 'folder' | 'note';
  title: string;
  parentId?: string | null;
  isExpanded?: boolean;
  depth: number;
  index: number;
}

export function useKeyboardNavigation(
  items: NavigableItem[],
  onToggleFolder?: (folderId: string) => void,
  onSelectFolder?: (folderId: string | null) => void
) {
  const router = useRouter();
  const { confirmNavigation } = useUnsavedChanges();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Filter visible items (not inside collapsed folders)
  const visibleItems = items.filter((item, index) => {
    if (index === 0) return true;
    
    // Check if any parent folder is collapsed
    let parentId = item.parentId;
    while (parentId) {
      const parent = items.find(i => i.id === parentId);
      if (parent && !parent.isExpanded) return false;
      parentId = parent?.parentId;
    }
    return true;
  });

  // Navigate up with arrow up
  useHotkeys('up', (e) => {
    if (!isNavigating) return;
    e.preventDefault();
    
    setSelectedIndex(prev => {
      const currentVisibleIndex = visibleItems.findIndex(item => item.index === prev);
      if (currentVisibleIndex > 0) {
        return visibleItems[currentVisibleIndex - 1].index;
      }
      return prev;
    });
  }, {
    enableOnFormTags: false,
  });

  // Navigate down with arrow down
  useHotkeys('down', (e) => {
    if (!isNavigating) return;
    e.preventDefault();
    
    setSelectedIndex(prev => {
      const currentVisibleIndex = visibleItems.findIndex(item => item.index === prev);
      if (currentVisibleIndex < visibleItems.length - 1 && currentVisibleIndex !== -1) {
        return visibleItems[currentVisibleIndex + 1].index;
      } else if (prev === -1 && visibleItems.length > 0) {
        return visibleItems[0].index;
      }
      return prev;
    });
  }, {
    enableOnFormTags: false,
  });

  // Expand/collapse folder with right/left arrows
  useHotkeys('right', (e) => {
    if (!isNavigating || selectedIndex === -1) return;
    e.preventDefault();
    
    const selectedItem = items[selectedIndex];
    if (selectedItem?.type === 'folder' && !selectedItem.isExpanded && onToggleFolder) {
      onToggleFolder(selectedItem.id);
    }
  }, {
    enableOnFormTags: false,
  });

  useHotkeys('left', (e) => {
    if (!isNavigating || selectedIndex === -1) return;
    e.preventDefault();
    
    const selectedItem = items[selectedIndex];
    if (selectedItem?.type === 'folder' && selectedItem.isExpanded && onToggleFolder) {
      onToggleFolder(selectedItem.id);
    } else if (selectedItem?.parentId) {
      // Navigate to parent folder
      const parentIndex = items.findIndex(i => i.id === selectedItem.parentId);
      if (parentIndex !== -1) {
        setSelectedIndex(parentIndex);
      }
    }
  }, {
    enableOnFormTags: false,
  });

  // Open note or select folder with Enter
  useHotkeys('enter', (e) => {
    if (!isNavigating || selectedIndex === -1) return;
    e.preventDefault();
    
    const selectedItem = items[selectedIndex];
    if (selectedItem?.type === 'note') {
      confirmNavigation(() => router.push(`/notes/${selectedItem.id}`));
    } else if (selectedItem?.type === 'folder' && onSelectFolder) {
      onSelectFolder(selectedItem.id);
    }
  }, {
    enableOnFormTags: false,
  });

  // Start navigation mode when pressing any arrow key
  useHotkeys('up,down,left,right', () => {
    if (!isNavigating) {
      setIsNavigating(true);
      if (selectedIndex === -1 && visibleItems.length > 0) {
        setSelectedIndex(visibleItems[0].index);
      }
    }
  }, {
    enableOnFormTags: false,
  });

  // Exit navigation mode on Escape
  useHotkeys('escape', () => {
    if (isNavigating) {
      setIsNavigating(false);
      setSelectedIndex(-1);
    }
  }, {
    enableOnFormTags: false,
  });

  return {
    selectedIndex,
    isNavigating,
    setSelectedIndex: useCallback((index: number) => {
      setSelectedIndex(index);
      setIsNavigating(true);
    }, []),
  };
}