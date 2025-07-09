'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BlockNoteEditorComponent } from '@/components/editor/block-note-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, MoreVertical, Trash2, Share2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { RelativeTime } from '@/components/ui/relative-time';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  
  const [note, setNote] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState('Untitled Note');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Debounce both title and content changes for autosave
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedContent = useDebounce(content, 2000);

  // Load note data
  useEffect(() => {
    const loadNote = async () => {
      setIsLoading(true);
      try {
        // Check if it's a new note
        if (noteId.startsWith('new-')) {
          // Create new note
          const defaultContent = [
            {
              type: 'paragraph',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [],
              children: [],
            },
          ];
          
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Untitled Note',
              content: defaultContent,
            }),
          });
          
          if (!response.ok) throw new Error('Failed to create note');
          
          const { note: newNote } = await response.json();
          router.replace(`/notes/${newNote.id}`);
          return;
        }
        
        // Load existing note
        const response = await fetch(`/api/notes/${noteId}`);
        if (!response.ok) throw new Error('Failed to load note');
        
        const { note } = await response.json();
        setNote(note);
        setTitle(note.title);
        // Ensure content is never empty for BlockNote
        const noteContent = note.content && Array.isArray(note.content) && note.content.length > 0 
          ? note.content 
          : [{
              type: 'paragraph',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [],
              children: [],
            }];
        setContent(noteContent);
        setLastSaved(new Date(note.updatedAt));
      } catch (error) {
        toast.error('Failed to load note');
        router.push('/notes');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNote();
  }, [noteId, router]);

  // Track changes
  const handleContentChange = useCallback((newContent: any) => {
    console.log('Content changed:', newContent);
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);
  
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  }, []);
  
  // Autosave functionality
  useEffect(() => {
    if (hasUnsavedChanges && noteId && !noteId.startsWith('new-') && (debouncedContent || debouncedTitle)) {
      handleSave();
    }
  }, [debouncedContent, debouncedTitle, hasUnsavedChanges, handleSave, noteId]);

  const handleSave = useCallback(async () => {
    if (!noteId || noteId.startsWith('new-')) return;
    
    console.log('Saving note:', { title, content });
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      const savedNote = await response.json();
      console.log('Note saved:', savedNote);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Note saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [noteId, title, content]);

  const handleDelete = async () => {
    if (!noteId || noteId.startsWith('new-')) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        toast.success('Note deleted');
        router.push('/notes');
      } catch {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    toast.info('Sharing coming soon!');
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="bg-transparent text-lg font-semibold outline-none"
              placeholder="Untitled Note"
            />
            {lastSaved && (
              <RelativeTime date={lastSaved} />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Save className="h-4 w-4 animate-pulse" />
              <span>Saving...</span>
            </motion.div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full px-4 py-6 md:px-8 lg:px-12">
          <div className="mx-auto h-full max-w-4xl">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading note...</p>
                </div>
              </div>
            ) : (
              content && (
                <BlockNoteEditorComponent
                  initialContent={content}
                  onContentChange={handleContentChange}
                />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}