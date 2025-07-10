'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { RelativeTime } from '@/components/ui/relative-time';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrashedNote {
  id: string;
  title: string;
  content: any;
  deletedAt: string;
  folder?: {
    id: string;
    name: string;
  };
}

export default function TrashPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<TrashedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<TrashedNote | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load trashed notes
  useEffect(() => {
    const loadTrashedNotes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/notes/trash');
        if (!response.ok) throw new Error('Failed to load trashed notes');
        
        const { notes } = await response.json();
        setNotes(notes);
      } catch (error) {
        toast.error('Failed to load trashed notes');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrashedNotes();
  }, []);

  const handleRestore = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/restore`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to restore note');
      
      // Remove from local state
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success('Note restored successfully');
      // Trigger refresh event to update the sidebar
      window.dispatchEvent(new Event('refresh-notes'));
    } catch (error) {
      toast.error('Failed to restore note');
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedNote) return;
    
    try {
      const response = await fetch(`/api/notes/${selectedNote.id}/permanent-delete`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete note permanently');
      
      // Remove from local state
      setNotes(notes.filter(n => n.id !== selectedNote.id));
      toast.success('Note permanently deleted');
      setShowDeleteDialog(false);
      setSelectedNote(null);
      // Trigger refresh event in case the note was in a folder
      window.dispatchEvent(new Event('refresh-notes'));
    } catch (error) {
      toast.error('Failed to delete note permanently');
    }
  };

  const handleEmptyTrash = async () => {
    if (notes.length === 0) return;
    
    if (confirm(`Are you sure you want to permanently delete all ${notes.length} notes in trash?`)) {
      try {
        // Delete all notes one by one
        const deletePromises = notes.map(note =>
          fetch(`/api/notes/${note.id}/permanent-delete`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        
        setNotes([]);
        toast.success('Trash emptied successfully');
        // Trigger refresh event to update the sidebar
        window.dispatchEvent(new Event('refresh-notes'));
      } catch (error) {
        toast.error('Failed to empty trash');
      }
    }
  };

  // Filter notes based on search
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Extract text from BlockNote content for preview
  const getContentPreview = (content: any): string => {
    if (!content || !Array.isArray(content)) return '';
    
    const extractText = (blocks: any[]): string => {
      let text = '';
      for (const block of blocks) {
        if (block.content) {
          for (const item of block.content) {
            if (item.type === 'text' && item.text) {
              text += item.text + ' ';
            }
          }
        }
        if (block.children) {
          text += extractText(block.children);
        }
      }
      return text;
    };
    
    const preview = extractText(content).trim();
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Trash</h1>
                <p className="text-sm text-muted-foreground">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} in trash
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmptyTrash}
              disabled={notes.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Empty Trash
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search in trash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-2 text-sm text-muted-foreground">Loading trashed notes...</p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">
                {searchQuery ? 'No notes found' : 'Trash is empty'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Deleted notes will appear here'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-1 text-base">
                        {note.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        {note.folder && (
                          <>
                            <span>{note.folder.name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>Deleted <RelativeTime date={note.deletedAt} /></span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {getContentPreview(note.content)}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(note.id)}
                          className="flex-1"
                        >
                          <RotateCcw className="mr-2 h-3 w-3" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedNote(note);
                            setShowDeleteDialog(true);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedNote?.title}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}