'use client';

import { ChevronRight, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/layouts/user-profile';
import { FolderTreeWithNotes } from '@/components/layouts/folder-tree-with-notes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFoldersWithNotes } from '@/hooks/useFoldersWithNotes';
import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders, rootNotes, isLoading, createFolder, updateFolder, deleteFolder, updateFolderPositions, moveNoteToFolder } = useFoldersWithNotes();

  const handleCreateNote = async () => {
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
        body: JSON.stringify({
          title: 'Untitled Note',
          content: defaultContent,
          folderId: selectedFolderId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create note');
      
      const { note } = await response.json();
      router.push(`/notes/${note.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  return (
    <motion.aside
      className="sidebar relative flex h-screen flex-col border-r bg-background"
      animate={{ width: collapsed ? 60 : 280 }}
      initial={false}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Logo and Version */}
      <div className="border-b p-4">
        <div className={cn("flex items-baseline gap-2", collapsed && "justify-center")}>
          <h1 className={cn("text-2xl font-bold tracking-tight", collapsed && "text-lg")}>
            {collapsed ? "N" : "NotesFlow"}
          </h1>
          {!collapsed && (
            <span className="text-xs text-muted-foreground">v0.1</span>
          )}
        </div>
      </div>

      {/* Collapse/Expand Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
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
                <motion.div
                  animate={{ rotate: collapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Profile Section */}
      <div className="border-b p-4">
        <UserProfile collapsed={collapsed} />
      </div>

      {/* Quick Actions */}
      <div className="border-b p-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                className="w-full justify-start"
                onClick={handleCreateNote}
              >
                <Plus className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && "New Note"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Create new note
            </TooltipContent>
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
            <FolderTreeWithNotes
              folders={folders}
              rootNotes={rootNotes}
              collapsed={collapsed}
              onCreateFolder={createFolder}
              onUpdateFolder={updateFolder}
              onDeleteFolder={deleteFolder}
              onUpdatePositions={updateFolderPositions}
              onMoveNoteToFolder={moveNoteToFolder}
              onSelectFolder={setSelectedFolderId}
              selectedFolderId={selectedFolderId}
            />
          )}
        </div>
      </ScrollArea>

      {/* Bottom Section - Settings/Actions */}
      <div className="border-t p-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/trash" className="block">
                <Button
                  variant="ghost"
                  size={collapsed ? "icon" : "sm"}
                  className="w-full justify-start"
                >
                  <Trash2 className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && "Trash"}
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              View deleted notes
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.aside>
  );
}