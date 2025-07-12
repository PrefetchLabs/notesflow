'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { FileText, Clock, Search, FolderOpen } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRecentNotes } from '@/hooks/useRecentNotes';
import { useFoldersWithNotes } from '@/hooks/useFoldersWithNotes';
import { useUnsavedChanges } from '@/contexts/unsaved-changes-context';

interface QuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  folder?: {
    id: string;
    name: string;
  } | null;
}

export function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const router = useRouter();
  const { confirmNavigation } = useUnsavedChanges();
  const { recentNotes, fetchRecentNotes } = useRecentNotes();
  const { folders, rootNotes } = useFoldersWithNotes();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch recent notes when dialog opens
  useEffect(() => {
    if (open) {
      fetchRecentNotes();
      setSearch('');
      setSearchResults([]);
    }
  }, [open, fetchRecentNotes]);

  // Search notes when search query changes
  useEffect(() => {
    const searchNow = async () => {
      if (search.length > 1) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/notes/search?q=${encodeURIComponent(search)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.notes);
          }
        } catch (error) {
          // [REMOVED_CONSOLE]
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timer = setTimeout(searchNow, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (noteId: string) => {
    onOpenChange(false);
    confirmNavigation(() => router.push(`/notes/${noteId}`));
  };

  const renderNote = (note: SearchResult | typeof rootNotes[0], showFolder = true) => {
    const folder = note.folderId ? 
      folders.find(f => f.id === note.folderId) : null;

    return (
      <Command.Item
        key={note.id}
        value={`${note.title} ${folder?.name || ''}`}
        onSelect={() => handleSelect(note.id)}
        className="flex items-center gap-3 px-3 py-2"
      >
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate">{note.title}</span>
            {showFolder && folder && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {folder.name}
              </span>
            )}
          </div>
        </div>
      </Command.Item>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-2xl">
        <Command className="rounded-lg" loop>
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Command.Input
              placeholder="Search notes..."
              value={search}
              onValueChange={setSearch}
              className="h-12 w-full border-0 bg-transparent placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {isSearching ? 'Searching...' : 'No notes found.'}
            </Command.Empty>

            {/* Recent Notes */}
            {!search && recentNotes.length > 0 && (
              <Command.Group heading="Recent">
                {recentNotes.map(note => (
                  <Command.Item
                    key={note.id}
                    value={note.title}
                    onSelect={() => handleSelect(note.id)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{note.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results */}
            {search && searchResults.length > 0 && (
              <Command.Group heading="Search Results">
                {searchResults.map(note => renderNote(note))}
              </Command.Group>
            )}

            {/* All Notes (when not searching) */}
            {!search && (
              <>
                {/* Root Notes */}
                {rootNotes.length > 0 && (
                  <Command.Group heading="Notes">
                    {rootNotes.map(note => renderNote(note, false))}
                  </Command.Group>
                )}

                {/* Folder Notes */}
                {folders.map(folder => 
                  folder.notes && folder.notes.length > 0 && (
                    <Command.Group key={folder.id} heading={folder.name}>
                      {folder.notes.map(note => renderNote(note, false))}
                    </Command.Group>
                  )
                )}
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}