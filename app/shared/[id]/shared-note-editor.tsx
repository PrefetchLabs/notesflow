'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CollaborativeEditorFinal as CollaborativeEditor } from '@/components/editor/collaborative-editor-final';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AnonymousAuthProvider } from '@/lib/auth/anonymous-auth-context';

interface SharedNoteEditorProps {
  noteId: string;
  initialContent: any;
  noteTitle?: string;
}

export function SharedNoteEditor({ noteId, initialContent, noteTitle }: SharedNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(true);
  const [userName, setUserName] = useState('');
  const [userSetup, setUserSetup] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Get or generate anonymous user ID
  const getAnonymousUserId = () => {
    const storageKey = 'anonymous-user-id';
    let userId = localStorage.getItem(storageKey);
    if (!userId) {
      userId = `anon-${crypto.randomUUID()}`;
      localStorage.setItem(storageKey, userId);
    }
    return userId;
  };

  // Get or set user name
  const getUserName = () => {
    const storageKey = 'anonymous-user-name';
    return localStorage.getItem(storageKey) || '';
  };

  const saveUserName = (name: string) => {
    localStorage.setItem('anonymous-user-name', name);
    setUserName(name);
    setUserSetup(true);
    setIsNameDialogOpen(false);
  };

  // Initialize user
  useEffect(() => {
    const savedName = getUserName();
    if (savedName) {
      setUserName(savedName);
      setUserSetup(true);
      setIsNameDialogOpen(false);
    }
  }, []);

  // Auto-save content
  const handleContentChange = useCallback(async (newContent: any) => {
    setContent(newContent);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/shared-notes/${noteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newContent,
            anonymousUserId: getAnonymousUserId(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save');
        }
      } catch (error) {
        // [REMOVED_CONSOLE]
        toast.error('Failed to save changes');
      }
    }, 1000); // 1 second debounce
  }, [noteId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Mock auth hook for anonymous users
  const mockAuth = {
    user: userSetup ? {
      id: getAnonymousUserId(),
      name: userName || 'Anonymous',
      email: `${getAnonymousUserId()}@anonymous.local`,
    } : null,
  };

  // Override the auth context for this component
  return (
    <>
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Collaborative Editing</DialogTitle>
            <DialogDescription>
              Choose a name to identify yourself to other collaborators
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userName.trim()) {
                  saveUserName(userName.trim());
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                saveUserName('Anonymous');
              }}
            >
              Continue as Anonymous
            </Button>
            <Button
              onClick={() => {
                if (userName.trim()) {
                  saveUserName(userName.trim());
                }
              }}
              disabled={!userName.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {userSetup && (
        <div className="h-full relative">
          {/* User info */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Editing as {userName}</span>
            </div>
          </div>

          {/* Collaborative Editor with mock auth */}
          <div className="h-full">
            {/* We need to wrap this in a custom auth provider context */}
            <CollaborativeEditorWithMockAuth
              noteId={noteId}
              initialContent={content}
              onContentChange={handleContentChange}
              mockUser={mockAuth.user}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Wrapper component to provide mock auth
function CollaborativeEditorWithMockAuth({ 
  noteId, 
  initialContent, 
  onContentChange,
  mockUser 
}: any) {
  return (
    <AnonymousAuthProvider user={mockUser}>
      <CollaborativeEditor
        noteId={noteId}
        initialContent={initialContent}
        onContentChange={onContentChange}
        editable={true}
        isShared={true}
      />
    </AnonymousAuthProvider>
  );
}