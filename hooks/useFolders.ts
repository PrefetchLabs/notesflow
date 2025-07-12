import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  position: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  children: Folder[];
  isExpanded?: boolean;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) throw new Error('Failed to load folders');
      
      const { folders } = await response.json();
      setFolders(folders);
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create folder
  const createFolder = useCallback(async (name: string, parentId?: string) => {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      });
      
      if (!response.ok) throw new Error('Failed to create folder');
      
      const { folder } = await response.json();
      await loadFolders(); // Reload to get updated tree
      toast.success('Folder created');
      return folder;
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to create folder');
      return null;
    }
  }, [loadFolders]);

  // Update folder
  const updateFolder = useCallback(async (id: string, updates: Partial<Folder>) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update folder');
      
      const { folder } = await response.json();
      await loadFolders(); // Reload to get updated tree
      return folder;
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to update folder');
      return null;
    }
  }, [loadFolders]);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete folder');
      }
      
      await loadFolders(); // Reload to get updated tree
      toast.success('Folder deleted');
      return true;
    } catch (error: any) {
      // [REMOVED_CONSOLE]
      toast.error(error.message || 'Failed to delete folder');
      return false;
    }
  }, [loadFolders]);

  // Update folder positions after drag and drop
  const updateFolderPositions = useCallback(async (updates: { id: string; position: number; parentId?: string | null }[]) => {
    try {
      // Update all folders in parallel
      await Promise.all(
        updates.map(update =>
          fetch(`/api/folders/${update.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position: update.position,
              parentId: update.parentId,
            }),
          })
        )
      );
      
      await loadFolders(); // Reload to get updated tree
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to update folder order');
    }
  }, [loadFolders]);

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFolderPositions,
    refresh: loadFolders,
  };
}