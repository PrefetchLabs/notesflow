'use client';

import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder as FolderType } from '@/hooks/useFolders';

interface DraggableFolderTreeProps {
  folders: FolderType[];
  collapsed: boolean;
  onCreateFolder: (name: string, parentId?: string) => void;
  onUpdateFolder: (id: string, updates: Partial<FolderType>) => void;
  onDeleteFolder: (id: string) => void;
  onUpdatePositions: (updates: { id: string; position: number; parentId?: string | null }[]) => void;
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

interface SortableFolderItemProps {
  folder: FolderType;
  depth: number;
  collapsed: boolean;
  onToggle: (folderId: string) => void;
  onEdit: (folder: FolderType) => void;
  onDelete: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function RootDropZone({ isActive }: { isActive: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'root',
  });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-2 border-2 border-dashed rounded-md p-4 text-center text-sm text-muted-foreground transition-colors",
        isOver && "border-primary bg-primary/10"
      )}
    >
      Drop here to move to root
    </div>
  );
}

function TrashDropZone({ isActive, onDrop }: { isActive: boolean; onDrop: (folderId: string) => void }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'trash',
  });

  React.useEffect(() => {
    // Add drop zone to the trash button
    const trashElement = document.getElementById('trash-drop-zone');
    if (trashElement && isActive) {
      trashElement.classList.add('transition-all');
      if (isOver) {
        trashElement.classList.add('bg-destructive/20', 'scale-105');
      } else {
        trashElement.classList.remove('bg-destructive/20', 'scale-105');
      }
    }
    return () => {
      if (trashElement) {
        trashElement.classList.remove('bg-destructive/20', 'scale-105', 'transition-all');
      }
    };
  }, [isActive, isOver]);

  return <div ref={setNodeRef} className="absolute inset-0" style={{ pointerEvents: 'none' }} />;
}

function SortableFolderItem({
  folder,
  depth,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  onAddSubfolder,
  isSelected,
  onSelect,
}: SortableFolderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = folder.isExpanded ? FolderOpen : Folder;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        isDragging && 'z-50'
      )}
    >
      <div
        className="flex flex-1 cursor-move items-center gap-1"
        onClick={onSelect}
        {...attributes}
        {...listeners}
      >
        {folder.children && folder.children.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(folder.id);
            }}
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform',
                folder.isExpanded && 'rotate-90'
              )}
            />
          </Button>
        )}
        {(!folder.children || folder.children.length === 0) && (
          <div className="h-4 w-4" />
        )}
        <Icon className="h-4 w-4 text-muted-foreground" />
        {!collapsed && (
          <span className="truncate">{folder.name}</span>
        )}
      </div>
      
      {!collapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAddSubfolder(folder.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(folder)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${folder.name}" and all its contents?`)) {
                  onDelete(folder.id);
                }
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function DraggableFolderTree({
  folders,
  collapsed,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onUpdatePositions,
  onSelectFolder,
  selectedFolderId,
}: DraggableFolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Find the active folder
    const findFolder = (folders: FolderType[], id: string): FolderType | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const activeFolder = findFolder(folders, active.id as string);
    
    if (!activeFolder) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Handle drop on trash
    if (over.id === 'trash') {
      if (confirm(`Are you sure you want to delete "${activeFolder.name}" and all its contents?`)) {
        onDeleteFolder(active.id as string);
      }
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Handle drop on root
    if (over.id === 'root') {
      const updates: { id: string; position: number; parentId?: string | null }[] = [];
      updates.push({
        id: active.id as string,
        position: folders.length,
        parentId: null,
      });
      onUpdatePositions(updates);
      setActiveId(null);
      setOverId(null);
      return;
    }

    const overFolder = findFolder(folders, over.id as string);
    
    if (!overFolder) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Prevent dropping a folder into its own children
    const isDescendant = (parentId: string, childId: string): boolean => {
      const findChildren = (folderId: string): string[] => {
        const folder = findFolder(folders, folderId);
        if (!folder || !folder.children) return [];
        
        let descendants: string[] = [];
        folder.children.forEach(child => {
          descendants.push(child.id);
          descendants = descendants.concat(findChildren(child.id));
        });
        return descendants;
      };
      
      return findChildren(parentId).includes(childId);
    };

    if (isDescendant(active.id as string, over.id as string)) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    // Handle the drop - update parent and positions
    const updates: { id: string; position: number; parentId?: string | null }[] = [];
    
    // Update the dropped folder to have the target folder as parent
    updates.push({
      id: active.id as string,
      position: overFolder.children?.length || 0,
      parentId: over.id as string,
    });

    onUpdatePositions(updates);
    
    setActiveId(null);
    setOverId(null);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    onCreateFolder(folderName, parentFolderId);
    setDialogOpen(false);
    setFolderName('');
    setParentFolderId(undefined);
  };

  const handleUpdateFolder = () => {
    if (!editingFolder || !folderName.trim()) return;
    onUpdateFolder(editingFolder.id, { name: folderName });
    setDialogOpen(false);
    setEditingFolder(null);
    setFolderName('');
  };

  const renderFolder = (folder: FolderType, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderWithExpanded = { ...folder, isExpanded };

    return (
      <div key={folder.id}>
        <div style={{ paddingLeft: depth * 16 }}>
          <SortableFolderItem
            folder={folderWithExpanded}
            depth={depth}
            collapsed={collapsed}
            onToggle={toggleFolder}
            onEdit={(f) => {
              setEditingFolder(f);
              setFolderName(f.name);
              setDialogOpen(true);
            }}
            onDelete={onDeleteFolder}
            onAddSubfolder={(parentId) => {
              setParentFolderId(parentId);
              setFolderName('');
              setEditingFolder(null);
              setDialogOpen(true);
            }}
            isSelected={selectedFolderId === folder.id}
            onSelect={() => onSelectFolder(folder.id)}
          />
        </div>
        
        <AnimatePresence>
          {isExpanded && folder.children && folder.children.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SortableContext
                items={folder.children.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {folder.children.map((child) => renderFolder(child, depth + 1))}
              </SortableContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const allFolderIds = folders.map(f => f.id);

  return (
    <>
      <div className="space-y-1">
        <div className="mb-2 flex items-center justify-between">
          <h3 className={cn('text-xs font-semibold uppercase text-muted-foreground', collapsed && 'sr-only')}>
            Folders
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setParentFolderId(undefined);
              setFolderName('');
              setEditingFolder(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <RootDropZone isActive={!!activeId} />
          <TrashDropZone isActive={!!activeId} onDrop={onDeleteFolder} />
          
          <SortableContext
            items={allFolderIds}
            strategy={verticalListSortingStrategy}
          >
            {folders.map((folder) => renderFolder(folder))}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className="rounded-md bg-background p-2 shadow-2xl border">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="text-sm">Moving folder...</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {folders.length === 0 && !collapsed && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No folders yet
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Rename Folder' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {editingFolder 
                ? 'Enter a new name for the folder.' 
                : parentFolderId 
                ? 'This will create a subfolder.' 
                : 'This will create a new top-level folder.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingFolder ? handleUpdateFolder() : handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}>
              {editingFolder ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}