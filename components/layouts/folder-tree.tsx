'use client';

import { useState, memo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  MoreVertical,
  Star,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FolderTreeSkeleton } from '@/components/skeletons';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderTreeProps {
  collapsed: boolean;
  isLoading?: boolean;
}

// Placeholder data structure
const PLACEHOLDER_FOLDERS = [
  {
    id: '1',
    name: 'Work',
    icon: '💼',
    children: [
      { id: '1-1', name: 'Project Alpha', type: 'folder' as const },
      { id: '1-2', name: 'Meeting Notes', type: 'note' as const },
      { id: '1-3', name: 'Roadmap 2024', type: 'note' as const, isPinned: true },
    ],
  },
  {
    id: '2',
    name: 'Personal',
    icon: '🏠',
    children: [
      { id: '2-1', name: 'Journal', type: 'folder' as const },
      { id: '2-2', name: 'Ideas', type: 'note' as const },
      { id: '2-3', name: 'Shopping List', type: 'note' as const },
    ],
  },
  {
    id: '3',
    name: 'Archive',
    icon: '📦',
    isSpecial: true,
    children: [],
  },
];

export const FolderTree = memo(function FolderTree({ collapsed, isLoading = false }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['1', '2']) // Default expanded
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  if (isLoading) {
    return <FolderTreeSkeleton collapsed={collapsed} />;
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderItem = (item: any, level: number = 0) => {
    const isFolder = !item.type || item.type === 'folder';
    const isExpanded = expandedFolders.has(item.id);
    const isSelected = selectedItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    const content = (
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
          'hover:bg-accent/50',
          isSelected && 'bg-accent',
          collapsed && 'justify-center'
        )}
        style={{ paddingLeft: collapsed ? '8px' : `${8 + level * 16}px` }}
        onClick={() => {
          if (isFolder && hasChildren) {
            toggleFolder(item.id);
          }
          setSelectedItem(item.id);
        }}
      >
        {/* Icon */}
        <div className="flex h-4 w-4 items-center justify-center text-muted-foreground">
          {isFolder ? (
            item.isSpecial ? (
              <Archive className="h-4 w-4" />
            ) : isExpanded && hasChildren ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>

        {/* Name and actions */}
        {!collapsed && (
          <>
            <span className="flex-1 truncate">
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.name}
            </span>
            
            {/* Item indicators */}
            {item.isPinned && (
              <Star className="h-3 w-3 fill-current text-yellow-500" />
            )}
            
            {/* Actions on hover */}
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle actions menu
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <TooltipProvider key={item.id} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">
              <span>
                {item.icon && <span className="mr-1">{item.icon}</span>}
                {item.name}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div key={item.id}>
        {content}
        {isFolder && isExpanded && hasChildren && (
          <div className="mt-0.5">
            {item.children.map((child: any) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree space-y-1">
      {/* Header with add button */}
      <div className={cn(
        'mb-2 flex items-center justify-between',
        collapsed && 'justify-center'
      )}>
        {!collapsed && (
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Folders
          </span>
        )}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  // Handle new folder creation
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={collapsed ? 'right' : 'top'}>
              New folder
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Folder tree */}
      <div className="space-y-0.5">
        {PLACEHOLDER_FOLDERS.map((folder) => renderItem(folder))}
      </div>

      {/* Quick access section */}
      {!collapsed && (
        <div className="mt-6">
          <span className="mb-2 block text-xs font-medium uppercase text-muted-foreground">
            Quick Access
          </span>
          <div className="space-y-0.5">
            <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>Starred</span>
            </div>
            <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span>Archive</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});