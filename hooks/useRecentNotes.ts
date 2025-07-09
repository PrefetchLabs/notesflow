import { useState, useEffect, useCallback } from 'react';
import { Note } from '@/lib/db/schema/notes';

const RECENT_NOTES_KEY = 'notesflow-recent-notes';
const MAX_RECENT_NOTES = 5;

interface RecentNote {
  id: string;
  title: string;
  lastAccessedAt: string;
  folderId?: string | null;
}

export function useRecentNotes() {
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recent notes from localStorage on mount
  useEffect(() => {
    const loadRecentNotes = () => {
      try {
        const stored = localStorage.getItem(RECENT_NOTES_KEY);
        if (stored) {
          const notes = JSON.parse(stored) as RecentNote[];
          setRecentNotes(notes);
        }
      } catch (error) {
        console.error('Failed to load recent notes from localStorage:', error);
      }
      setIsLoading(false);
    };

    loadRecentNotes();
  }, []);

  // Fetch recent notes from API
  const fetchRecentNotes = async () => {
    try {
      const response = await fetch('/api/notes/recent', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Failed to fetch recent notes');
      
      const data = await response.json();
      const notes: RecentNote[] = data.notes.map((note: any) => ({
        id: note.id,
        title: note.title,
        lastAccessedAt: note.lastAccessedAt,
        folderId: note.folderId,
      }));
      
      setRecentNotes(notes);
      localStorage.setItem(RECENT_NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to fetch recent notes:', error);
    }
  };

  // Add a note to recent list
  const addToRecent = useCallback((note: { id: string; title: string; folderId?: string | null }) => {
    const newRecent: RecentNote = {
      id: note.id,
      title: note.title,
      lastAccessedAt: new Date().toISOString(),
      folderId: note.folderId,
    };

    setRecentNotes(prev => {
      // Remove if already exists
      const filtered = prev.filter(n => n.id !== note.id);
      // Add to beginning and limit to MAX_RECENT_NOTES
      const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_NOTES);
      
      // Save to localStorage
      localStorage.setItem(RECENT_NOTES_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Clear recent notes
  const clearRecent = () => {
    setRecentNotes([]);
    localStorage.removeItem(RECENT_NOTES_KEY);
  };

  return {
    recentNotes,
    isLoading,
    fetchRecentNotes,
    addToRecent,
    clearRecent,
  };
}