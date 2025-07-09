'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoNotes } from '@/components/empty-states';
import { Plus, Search, FileText, Calendar, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: any;
  updatedAt: string;
  folder?: {
    id: string;
    name: string;
  } | null;
}

export default function NotesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error('Failed to load notes');
        
        const { notes } = await response.json();
        setNotes(notes);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotes();
  }, []);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Generate excerpt from content
  const getExcerpt = (content: any): string => {
    if (!content || !Array.isArray(content)) return 'No content';
    
    // Find first text content
    for (const block of content) {
      if (block.content && Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.type === 'text' && item.text) {
            return item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '');
          }
        }
      }
    }
    return 'No content';
  };

  const handleCreateNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: [],
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create note');
      
      const { note } = await response.json();
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleNoteClick = (noteId: string) => {
    router.push(`/notes/${noteId}`);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Notes</h1>
          <Button onClick={handleCreateNote} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      {/* Notes list */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            {searchQuery ? (
              <div className="text-center">
                <p className="text-muted-foreground">
                  No notes found matching &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <NoNotes onCreateNote={handleCreateNote} />
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-3">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative cursor-pointer rounded-lg border bg-card p-4 transition-all hover:shadow-md"
                onClick={() => handleNoteClick(note.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{note.title}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {getExcerpt(note.content)}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{note.folder?.name || 'No folder'}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Add to Calendar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Delete note
                        }}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}