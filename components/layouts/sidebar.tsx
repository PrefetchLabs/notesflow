'use client';

import { ChevronRight, FileText, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/layouts/user-profile';
import { FolderTreeWithNotes } from '@/components/layouts/folder-tree-with-notes';
import { SharedNotesSection } from '@/components/layouts/shared-notes-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFoldersWithNotes } from '@/hooks/useFoldersWithNotes';
import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/useResponsive';
import { APP_VERSION } from '@/lib/config/version';

interface SidebarProps {
  onToggle: () => void;
}

export function Sidebar({ onToggle }: SidebarProps) {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const {
    folders,
    rootNotes,
    sharedNotes,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    updateFolderPositions,
    moveNoteToFolder,
    refresh,
  } = useFoldersWithNotes();
  const { checkLimit, refreshSubscription } = useSubscription();
  const { isMobile } = useResponsive();

  // Force refresh on mount and periodically to ensure we have latest shared notes
  useEffect(() => {
    refresh();
    
    // Set up periodic refresh every 30 seconds as a fallback
    const interval = setInterval(() => {
      refresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refresh]);

  const handleCreateNote = async () => {
    // Check note limit before creating
    const noteLimit = checkLimit('maxNotes');
    if (!noteLimit.allowed) {
      toast.error(
        `You've reached the limit of ${noteLimit.limit} notes on the free plan. Upgrade to Pro for unlimited notes!`,
        {
          action: {
            label: 'Upgrade to Pro',
            onClick: () => router.push('/upgrade'),
          },
        }
      );
      return;
    }

    try {
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
        credentials: 'same-origin',
        body: JSON.stringify({
          title: 'Untitled Note',
          content: defaultContent,
          folderId: selectedFolderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.requiresUpgrade) {
          toast.error(error.error, {
            action: {
              label: 'Upgrade to Pro',
              onClick: () => router.push('/upgrade'),
            },
          });
          return;
        }
        throw new Error('Failed to create note');
      }

      const { note } = await response.json();
      // Trigger refresh event to update the sidebar
      window.dispatchEvent(new Event('refresh-notes'));
      // Refresh subscription to update usage counts
      await refreshSubscription();
      router.push(`/notes/${note.id}`);
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to create note');
    }
  };

  return (
    <aside
      className={cn(
        'sidebar relative flex h-screen flex-col border-r bg-sidebar-background',
        isMobile ? 'w-full' : 'w-[280px]'
      )}
    >
      {/* Logo and Version */}
      <div className="border-b p-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold text-foreground font-notes-flow whitespace-nowrap">
            NotesFlow
          </h1>
          <span className="text-sm font-normal text-muted-foreground ml-1 hidden sm:inline">
            {APP_VERSION}
          </span>
        </div>
      </div>

      {/* Hide Sidebar Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                'absolute -right-4 top-6 z-10 h-8 w-8 rounded-full border bg-background shadow-sm',
                'hover:bg-accent hover:shadow-md',
                'transition-shadow duration-200'
              )}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide sidebar</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Profile Section */}
      <div className="border-b p-4">
        <UserProfile collapsed={false} />
      </div>

      {/* Quick Actions */}
      <div className="border-b p-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={isMobile ? 'default' : 'sm'}
                className={cn(
                  'w-full justify-start',
                  isMobile && 'h-12' // Larger touch target on mobile
                )}
                onClick={handleCreateNote}
              >
                <Plus className={cn('mr-2', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                New Note
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Create new note</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Folder Tree Section */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              {/* Shared Notes Section */}
              {sharedNotes.length > 0 && (
                <SharedNotesSection notes={sharedNotes} collapsed={false} />
              )}

              {/* My Notes Section */}
              <FolderTreeWithNotes
                folders={folders}
                rootNotes={rootNotes}
                collapsed={false}
                onCreateFolder={createFolder}
                onUpdateFolder={updateFolder}
                onDeleteFolder={deleteFolder}
                onUpdatePositions={updateFolderPositions}
                onMoveNoteToFolder={moveNoteToFolder}
                onSelectFolder={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
              />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Section - Settings/Actions */}
      <div className="border-t p-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div id="trash-drop-zone">
                <Link href="/trash" className="block">
                  <Button
                    variant="ghost"
                    size={isMobile ? 'default' : 'sm'}
                    className={cn(
                      'w-full justify-start',
                      isMobile && 'h-12' // Larger touch target on mobile
                    )}
                  >
                    <Trash2 className={cn('mr-2', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
                    Trash
                  </Button>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">View deleted notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
