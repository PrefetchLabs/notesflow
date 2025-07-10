'use client';

import { Note } from '@/hooks/useFoldersWithNotes';
import { ChevronRight, Users, FileText, Eye, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

interface SharedNotesSectionProps {
  notes: Note[];
  collapsed: boolean;
}

export function SharedNotesSection({ notes, collapsed }: SharedNotesSectionProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const { confirmNavigation } = useUnsavedChanges();

  if (notes.length === 0) return null;

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start px-2 py-1.5 h-auto font-medium"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight 
          className={cn(
            "h-4 w-4 transition-transform mr-1",
            isExpanded && "rotate-90"
          )} 
        />
        <Users className="h-4 w-4 mr-2" />
        {!collapsed && <span>Shared with me ({notes.length})</span>}
      </Button>

      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {notes.map((note) => (
            <TooltipProvider key={note.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start px-2 py-1.5 h-auto ml-6",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => confirmNavigation(() => router.push(`/notes/${note.id}`))}
                  >
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{note.title}</span>
                        <div className="flex items-center gap-1">
                          {note.permissionLevel === 'view' ? (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Edit3 className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Shared by {note.owner?.name || note.owner?.email || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {note.permissionLevel === 'view' ? 'View only' : 'Can edit'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
    </div>
  );
}