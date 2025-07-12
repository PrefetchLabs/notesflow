'use client';

import { useState, useMemo } from 'react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { 
  ChevronRight, 
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Users,
  Eye,
  Edit3,
  Circle,
} from 'lucide-react';
import { FolderIcon, getFolderColorIndex } from '@/components/ui/folder-icon';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FolderWithNotes, Note } from '@/hooks/useFoldersWithNotes';
import { useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { PlanBadge } from '@/components/upgrade/plan-badge';

interface FolderTreeWithNotesProps {
  folders: FolderWithNotes[];
  rootNotes: Note[];
  collapsed: boolean;
  onCreateFolder: (name: string, parentId?: string) => void;
  onUpdateFolder: (id: string, updates: Partial<FolderWithNotes>) => void;
  onDeleteFolder: (id: string) => void;
  onUpdatePositions: (updates: { id: string; position: number; parentId?: string | null }[]) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
  onSelectFolder: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

interface SortableNoteItemProps {
  note: Note & { isShared?: boolean; hasActiveCollaborators?: boolean };
  collapsed: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function SortableNoteItem({ note, collapsed, isSelected, onClick }: SortableNoteItemProps) {
  const router = useRouter();
  const { confirmNavigation } = useUnsavedChanges();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `note-${note.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    if (onClick) onClick();
    confirmNavigation(() => router.push(`/notes/${note.id}`));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
        'hover:bg-accent hover:text-accent-foreground ml-4',
        isDragging && 'z-50'
      )}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <FileText className="h-4 w-4 text-muted-foreground" />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{note.title}</span>
          {note.isShared && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {note.permissionLevel === 'view' ? (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    ) : note.permissionLevel === 'edit' ? (
                      <Edit3 className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Users className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Shared by {note.owner?.name || note.owner?.email || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {note.permissionLevel === 'view' ? 'View only' : 
                     note.permissionLevel === 'edit' ? 'Can edit' : 'Owner'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}
    </div>
  );
}

interface SortableFolderItemProps {
  folder: FolderWithNotes;
  collapsed: boolean;
  onToggle: (folderId: string) => void;
  onEdit: (folder: FolderWithNotes) => void;
  onDelete: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableFolderItem({
  folder,
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
    isOver,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorIndex = getFolderColorIndex(folder.name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isOver && 'ring-2 ring-primary ring-offset-2 rounded-md'
      )}
    >
      <div
        className={cn(
          'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground',
          isDragging && 'z-50'
        )}
      >
        <div
          className="flex flex-1 cursor-move items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            // Also toggle expansion when clicking on the folder
            if (folder.children?.length > 0 || folder.notes?.length > 0) {
              onToggle(folder.id);
            }
          }}
          {...attributes}
          {...listeners}
        >
          {(folder.children?.length > 0 || folder.notes?.length > 0) && (
            <div className="h-4 w-4 p-0 flex items-center justify-center">
              <ChevronRight
                className={cn(
                  'h-3 w-3 transition-transform',
                  folder.isExpanded && 'rotate-90'
                )}
              />
            </div>
          )}
          {!(folder.children?.length > 0 || folder.notes?.length > 0) && (
            <div className="h-4 w-4" />
          )}
          <FolderIcon isOpen={folder.isExpanded} colorIndex={colorIndex} className="h-4 w-4" />
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
                onClick={() => onDelete(folder.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
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

export function FolderTreeWithNotes({
  folders,
  rootNotes,
  collapsed,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onUpdatePositions,
  onMoveNoteToFolder,
  onSelectFolder,
  selectedFolderId,
}: FolderTreeWithNotesProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderWithNotes | null>(null);
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string | undefined>();
  const { checkAndShowLimit, isPro } = useSubscription();

  // Build flat list of all navigable items for keyboard navigation
  const navigableItems = useMemo(() => {
    const items: any[] = [];
    let index = 0;

    // Add root notes
    rootNotes.forEach(note => {
      items.push({
        id: note.id,
        type: 'note',
        title: note.title,
        parentId: null,
        depth: 0,
        index: index++,
      });
    });

    // Add folders and their notes recursively
    const addFolder = (folder: FolderWithNotes, parentId: string | null, depth: number) => {
      const isExpanded = expandedFolders.has(folder.id);
      items.push({
        id: folder.id,
        type: 'folder',
        title: folder.name,
        parentId,
        isExpanded,
        depth,
        index: index++,
      });

      if (isExpanded) {
        // Add notes in this folder
        folder.notes?.forEach(note => {
          items.push({
            id: note.id,
            type: 'note',
            title: note.title,
            parentId: folder.id,
            depth: depth + 1,
            index: index++,
          });
        });

        // Add child folders
        folder.children?.forEach(child => {
          addFolder(child, folder.id, depth + 1);
        });
      }
    };

    folders.forEach(folder => addFolder(folder, null, 0));
    return items;
  }, [folders, rootNotes, expandedFolders]);

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
    // Handle drag over if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Check if we're dragging a note
    if (activeIdStr.startsWith('note-')) {
      const noteId = activeIdStr.replace('note-', '');
      const targetFolderId = overIdStr === 'root' ? null : overIdStr;
      
      onMoveNoteToFolder(noteId, targetFolderId);
    } else {
      // Handle folder drag (existing logic)
      const findFolder = (folders: FolderWithNotes[], id: string): FolderWithNotes | null => {
        for (const folder of folders) {
          if (folder.id === id) return folder;
          if (folder.children) {
            const found = findFolder(folder.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const activeFolder = findFolder(folders, activeIdStr);
      
      if (!activeFolder) {
        setActiveId(null);
        return;
      }

      if (overIdStr === 'root') {
        const updates: { id: string; position: number; parentId?: string | null }[] = [];
        updates.push({
          id: activeIdStr,
          position: folders.length,
          parentId: null,
        });
        onUpdatePositions(updates);
      } else {
        const overFolder = findFolder(folders, overIdStr);
        
        if (!overFolder) {
          setActiveId(null);
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

        if (isDescendant(activeIdStr, overIdStr)) {
          setActiveId(null);
          return;
        }

        const updates: { id: string; position: number; parentId?: string | null }[] = [];
        updates.push({
          id: activeIdStr,
          position: overFolder.children?.length || 0,
          parentId: overIdStr,
        });

        onUpdatePositions(updates);
      }
    }
    
    setActiveId(null);
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

  const { selectedIndex, isNavigating, setSelectedIndex } = useKeyboardNavigation(
    navigableItems,
    toggleFolder,
    onSelectFolder
  );

  const handleCreateFolder = () => {
    if (!folderName.trim()) return;
    
    // Check folder limit
    if (checkAndShowLimit('maxFolders', 'Folder creation')) {
      setDialogOpen(false);
      return;
    }
    
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

  const renderFolder = (folder: FolderWithNotes, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder.id);
    const folderWithExpanded = { ...folder, isExpanded };

    return (
      <div key={folder.id}>
        <div style={{ paddingLeft: depth * 16 }}>
          <SortableFolderItem
            folder={folderWithExpanded}
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
            isSelected={(() => {
              const folderItemIndex = navigableItems.findIndex(item => item.id === folder.id && item.type === 'folder');
              const isKeyboardSelected = selectedIndex === folderItemIndex && isNavigating;
              return selectedFolderId === folder.id || isKeyboardSelected;
            })()}
            onSelect={() => {
              const folderItemIndex = navigableItems.findIndex(item => item.id === folder.id && item.type === 'folder');
              onSelectFolder(folder.id);
              setSelectedIndex(folderItemIndex);
            }}
          />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Render notes in this folder */}
              {folder.notes && folder.notes.length > 0 && (
                <div style={{ paddingLeft: (depth + 1) * 16 }}>
                  <SortableContext
                    items={folder.notes.map(n => `note-${n.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {folder.notes.map((note) => {
                      const itemIndex = navigableItems.findIndex(item => item.id === note.id && item.type === 'note');
                      return (
                        <SortableNoteItem 
                          key={`note-${note.id}`} 
                          note={note} 
                          collapsed={collapsed}
                          isSelected={selectedIndex === itemIndex && isNavigating}
                          onClick={() => setSelectedIndex(itemIndex)}
                        />
                      );
                    })}
                  </SortableContext>
                </div>
              )}
              
              {/* Render child folders */}
              {folder.children && folder.children.length > 0 && (
                <SortableContext
                  items={folder.children.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {folder.children.map((child) => renderFolder(child, depth + 1))}
                </SortableContext>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const allFolderIds = folders.map(f => f.id);
  const allIds = [
    'root',
    ...allFolderIds,
    ...rootNotes.map(n => `note-${n.id}`),
    ...folders.flatMap(f => f.notes?.map(n => `note-${n.id}`) || []),
  ];

  return (
    <>
      <div className="space-y-1">
        <div className="mb-2 flex items-center justify-between">
          <h3 className={cn('text-xs font-semibold uppercase text-muted-foreground', collapsed && 'sr-only')}>
            Folders
          </h3>
          <div className="flex items-center gap-2">
            <PlanBadge size="sm" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                if (checkAndShowLimit('maxFolders', 'Folder creation')) {
                  return;
                }
                setParentFolderId(undefined);
                setFolderName('');
                setEditingFolder(null);
                setDialogOpen(true);
              }}
              title="Create new folder"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <RootDropZone isActive={!!activeId && activeId.startsWith('note-')} />
          
          <SortableContext
            items={allIds}
            strategy={verticalListSortingStrategy}
          >
            {/* Render root notes */}
            {rootNotes.length > 0 && (
              <div className="mb-2">
                {rootNotes.map((note) => {
                  const itemIndex = navigableItems.findIndex(item => item.id === note.id && item.type === 'note');
                  return (
                    <SortableNoteItem 
                      key={`note-${note.id}`} 
                      note={note} 
                      collapsed={collapsed}
                      isSelected={selectedIndex === itemIndex && isNavigating}
                      onClick={() => setSelectedIndex(itemIndex)}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Render folders */}
            {folders.map((folder) => renderFolder(folder))}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <div className="rounded-md bg-background p-2 shadow-2xl border">
                <div className="flex items-center gap-2">
                  {activeId.startsWith('note-') ? (
                    <>
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Moving note...</span>
                    </>
                  ) : (
                    <>
                      <FolderIcon isOpen={false} className="h-4 w-4" />
                      <span className="text-sm">Moving folder...</span>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {folders.length === 0 && rootNotes.length === 0 && !collapsed && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No folders or notes yet
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