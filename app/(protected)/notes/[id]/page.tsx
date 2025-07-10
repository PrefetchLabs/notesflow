'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BlockNoteAIEditor } from '@/components/editor/BlockNoteAIEditor';
import { CollaborativeEditorFinal } from '@/components/editor/collaborative-editor-final';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, MoreVertical, Trash2, Share2, Folder, ChevronRight } from 'lucide-react';
import { ShareDialogV2 } from '@/components/editor/share-dialog-v2';
import { useDebounce } from '@/hooks/useDebounce';
import { useSubscription } from '@/lib/contexts/subscription-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { RelativeTime } from '@/components/ui/relative-time';
import { useFolders } from '@/hooks/useFolders';
import { suggestTitleFromContent } from '@/lib/utils/titleExtraction';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';
import { useRecentNotes } from '@/hooks/useRecentNotes';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { folders } = useFolders();
  const { setHasUnsavedChanges: setGlobalUnsavedChanges, promptToSave } = useUnsavedChanges();
  const { addToRecent } = useRecentNotes();
  const { isPro } = useSubscription();
  
  const [note, setNote] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState('Untitled Note');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(true); // Default to true for owned notes
  const [isOwnNote, setIsOwnNote] = useState(true);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  
  // Debounce both title and content changes for autosave
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedContent = useDebounce(content, 2000);

  // Clear unsaved changes when unmounting
  useEffect(() => {
    return () => {
      setGlobalUnsavedChanges(false);
    };
  }, [setGlobalUnsavedChanges]);

  // Load note data
  useEffect(() => {
    // Reset permissions check when note changes
    setPermissionsChecked(false);
    
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
    
    // Check permissions and sharing status
    const checkPermissions = async () => {
      if (!noteId || noteId.startsWith('new-') || permissionsChecked) return;
      
      setPermissionsChecked(true);
      
      try {
        // First check if we own the note
        const meResponse = await fetch('/api/me');
        if (!meResponse.ok) return;
        const { user: currentUser } = await meResponse.json();
        
        // We need to fetch the note info to check ownership
        const noteResponse = await fetch(`/api/notes/${noteId}`);
        if (!noteResponse.ok) return;
        const { note: noteData } = await noteResponse.json();
        
        const isOwner = noteData?.userId === currentUser?.id;
        setIsOwnNote(isOwner);
        
        if (!isOwner) {
          // Check if we're a collaborator
          const collabResponse = await fetch(`/api/notes/${noteId}/collaborators`);
          if (collabResponse.ok) {
            const data = await collabResponse.json();
            const myCollaboration = data.collaborators?.find((c: any) => c.userId === currentUser?.id);
            if (myCollaboration) {
              setHasEditPermission(myCollaboration.permissionLevel === 'edit' || myCollaboration.permissionLevel === 'admin');
              setIsCollaborationEnabled(true);
            } else {
              // Not a collaborator, shouldn't have access
              toast.error('You do not have access to this note');
              router.push('/dashboard');
            }
          }
        } else {
          // Owner always has edit permission
          setHasEditPermission(true);
          // Check if collaboration is enabled (other users invited)
          const collabResponse = await fetch(`/api/notes/${noteId}/collaborators`);
          if (collabResponse.ok) {
            const data = await collabResponse.json();
            setIsCollaborationEnabled(data.collaborators?.length > 0 || data.publicAccess);
          }
        }
      } catch (error) {
        console.error('Failed to check permissions:', error);
      }
    };
    
    checkPermissions();
  }, [noteId, router]);

  // Add to recent notes when note is loaded
  useEffect(() => {
    if (note && !noteId.startsWith('new-')) {
      addToRecent({
        id: note.id,
        title: note.title,
        folderId: note.folderId,
      });
    }
  }, [note?.id, addToRecent]);

  // Define handleSave first
  const handleSave = useCallback(async () => {
    if (!noteId || noteId.startsWith('new-')) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setGlobalUnsavedChanges(false);
      toast.success('Note saved');
      // Trigger refresh event to update the sidebar with new title
      window.dispatchEvent(new Event('refresh-notes'));
    } catch {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [noteId, title, content, setGlobalUnsavedChanges]);
  
  // Track changes
  const handleContentChange = useCallback((newContent: any) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    setGlobalUnsavedChanges(true);
    
    // Auto-extract title from content if current title is generic
    const suggestedTitle = suggestTitleFromContent(title, newContent);
    if (suggestedTitle) {
      setTitle(suggestedTitle);
    }
  }, [title, setGlobalUnsavedChanges]);
  
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
    setGlobalUnsavedChanges(true);
  }, [setGlobalUnsavedChanges]);
  
  // Autosave functionality
  useEffect(() => {
    if (hasUnsavedChanges && noteId && !noteId.startsWith('new-') && (debouncedContent || debouncedTitle)) {
      handleSave();
    }
  }, [debouncedContent, debouncedTitle, hasUnsavedChanges, handleSave, noteId]);

  const handleDelete = useCallback(async () => {
    if (!noteId || noteId.startsWith('new-')) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        toast.success('Note moved to trash');
        // Trigger refresh event to update the sidebar
        window.dispatchEvent(new Event('refresh-notes'));
        router.push('/dashboard');
      } catch {
        toast.error('Failed to delete note');
      }
    }
  }, [noteId, router]);

  const handleShare = () => {
    if (!isPro) {
      toast.error(
        'Sharing is only available for Pro users',
        {
          action: {
            label: 'Upgrade to Pro',
            onClick: () => router.push('/upgrade'),
          },
        }
      );
      return;
    }
    setIsShareDialogOpen(true);
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!noteId || noteId.startsWith('new-')) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId: folderId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to move note');
      
      const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'root';
      toast.success(`Note moved to ${folderName || 'folder'}`);
      // Trigger refresh event to update the sidebar
      window.dispatchEvent(new Event('refresh-notes'));
    } catch (error) {
      toast.error('Failed to move note');
    }
  };

  // Get folder name for breadcrumb
  const getFolderPath = () => {
    if (!note?.folderId || !folders.length) return null;
    
    const findFolder = (folders: any[], id: string): any => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const folder = findFolder(folders, note.folderId);
    return folder?.name;
  };

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleSaveEvent = () => {
      if (hasUnsavedChanges) {
        handleSave();
      }
    };

    const handleDeleteEvent = () => {
      handleDelete();
    };

    window.addEventListener('save-note', handleSaveEvent);
    window.addEventListener('delete-note', handleDeleteEvent);

    return () => {
      window.removeEventListener('save-note', handleSaveEvent);
      window.removeEventListener('delete-note', handleDeleteEvent);
    };
  }, [hasUnsavedChanges, handleSave, handleDelete]);

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
                onClick={() => promptToSave(
                  handleSave,
                  () => router.push('/dashboard')
                )}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5 text-sm">
                <button
                  onClick={() => promptToSave(
                    handleSave,
                    () => router.push('/dashboard')
                  )}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>
                {getFolderPath() && (
                  <>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground hover:text-foreground transition-colors">
                      {getFolderPath()}
                    </span>
                  </>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{title || 'Untitled Note'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  <RelativeTime date={lastSaved} />
                </span>
              )}
              
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Save className="h-3 w-3 animate-pulse" />
                  <span>Saving...</span>
                </motion.div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Folder className="mr-2 h-4 w-4" />
                  Move to Folder
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                    No Folder (Root)
                  </DropdownMenuItem>
                  {folders.length > 0 && <DropdownMenuSeparator />}
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {isOwnNote && (
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}
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
          </div>
          
          {/* Title editing section */}
          <div className="mt-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50 focus:ring-0"
              placeholder="Untitled Note"
            />
          </div>
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
                hasEditPermission ? (
                  <CollaborativeEditorFinal
                    key={`editor-${noteId}`} // Single stable key
                    noteId={noteId}
                    initialContent={content}
                    onContentChange={handleContentChange}
                    forceCollaboration={isCollaborationEnabled}
                  />
                ) : (
                  // View-only mode for collaborators without edit permission
                  <div className="rounded-lg border bg-muted/10 p-8">
                    <BlockNoteAIEditor
                      key={`readonly-${noteId}`}
                      initialContent={content}
                      onContentChange={() => {}} // No-op for read-only
                      showAIUsage={false}
                      editable={false}
                    />
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      You have view-only access to this note.
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <ShareDialogV2 
        noteId={noteId} 
        noteTitle={title}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        onSharingEnabled={() => {
          setIsCollaborationEnabled(true);
          // Force page reload to switch to collaborative editor
          window.location.reload();
        }}
      />
    </div>
  );
}