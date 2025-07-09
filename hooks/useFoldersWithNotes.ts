import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Note {
  id: string;
  title: string;
  content: any;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithNotes {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  position: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  children: FolderWithNotes[];
  notes: Note[];
  isExpanded?: boolean;
}

export function useFoldersWithNotes() {
  const [folders, setFolders] = useState<FolderWithNotes[]>([]);
  const [rootNotes, setRootNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load folders and notes
  const loadData = useCallback(async () => {
    try {
      const [foldersResponse, notesResponse] = await Promise.all([
        fetch('/api/folders', { credentials: 'same-origin' }),
        fetch('/api/notes', { credentials: 'same-origin' }),
      ]);

      if (!foldersResponse.ok || !notesResponse.ok) {
        throw new Error('Failed to load data');
      }

      const { folders: folderData } = await foldersResponse.json();
      const { notes: notesData } = await notesResponse.json();

      // Group notes by folder
      const notesByFolder = new Map<string | null, Note[]>();
      notesData.forEach((note: Note) => {
        const folderId = note.folderId || null;
        if (!notesByFolder.has(folderId)) {
          notesByFolder.set(folderId, []);
        }
        notesByFolder.get(folderId)!.push(note);
      });

      // Add notes to folders
      const addNotesToFolder = (folder: any): FolderWithNotes => {
        const notes = notesByFolder.get(folder.id) || [];
        const children = folder.children ? folder.children.map(addNotesToFolder) : [];
        return { ...folder, notes, children };
      };

      const foldersWithNotes = folderData.map(addNotesToFolder);
      const rootNotes = notesByFolder.get(null) || [];

      setFolders(foldersWithNotes);
      setRootNotes(rootNotes);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load folders and notes');
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
        credentials: 'same-origin',
        body: JSON.stringify({ name, parentId }),
      });
      
      if (!response.ok) throw new Error('Failed to create folder');
      
      const { folder } = await response.json();
      await loadData(); // Reload to get updated tree
      toast.success('Folder created');
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  }, [loadData]);

  // Update folder
  const updateFolder = useCallback(async (id: string, updates: Partial<FolderWithNotes>) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update folder');
      
      const { folder } = await response.json();
      await loadData(); // Reload to get updated tree
      return folder;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
      return null;
    }
  }, [loadData]);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete folder');
      }
      
      await loadData(); // Reload to get updated tree
      toast.success('Folder deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting folder:', error);
      toast.error(error.message || 'Failed to delete folder');
      return false;
    }
  }, [loadData]);

  // Update folder positions after drag and drop
  const updateFolderPositions = useCallback(async (updates: { id: string; position: number; parentId?: string | null }[]) => {
    try {
      // Update all folders in parallel
      await Promise.all(
        updates.map(update =>
          fetch(`/api/folders/${update.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              position: update.position,
              parentId: update.parentId,
            }),
          })
        )
      );
      
      await loadData(); // Reload to get updated tree
    } catch (error) {
      console.error('Error updating folder positions:', error);
      toast.error('Failed to update folder order');
    }
  }, [loadData]);

  // Move note to folder
  const moveNoteToFolder = useCallback(async (noteId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ folderId }),
      });
      
      if (!response.ok) throw new Error('Failed to move note');
      
      await loadData(); // Reload to get updated tree
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'root';
      toast.success(`Note moved to ${folderName || 'folder'}`);
      return true;
    } catch (error) {
      console.error('Error moving note:', error);
      toast.error('Failed to move note');
      return false;
    }
  }, [loadData, folders]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    folders,
    rootNotes,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFolderPositions,
    moveNoteToFolder,
    refresh: loadData,
  };
}