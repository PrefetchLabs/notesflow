'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  keys: string;
  description: string;
  action?: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: 'Cmd/Ctrl + N', description: 'Create new note' },
  { keys: 'Cmd/Ctrl + S', description: 'Save current note' },
  { keys: 'Cmd/Ctrl + F', description: 'Search notes' },
  { keys: 'Cmd/Ctrl + Delete', description: 'Delete current note' },
  { keys: 'Cmd/Ctrl + K', description: 'Quick note switcher' },
  { keys: 'Cmd/Ctrl + Shift + ?', description: 'Show keyboard shortcuts' },
  { keys: '↑ ↓', description: 'Navigate notes/folders' },
  { keys: '→', description: 'Expand folder' },
  { keys: '←', description: 'Collapse folder / Go to parent' },
  { keys: 'Enter', description: 'Open note / Select folder' },
  { keys: 'Esc', description: 'Close dialogs/modals' },
];

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create new note (Cmd/Ctrl + N)
  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    router.push('/notes/new-' + Date.now());
  }, {
    enableOnFormTags: false,
  });

  // Save current note (Cmd/Ctrl + S)
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    // Trigger save event that the note editor will listen to
    window.dispatchEvent(new CustomEvent('save-note'));
  }, {
    enableOnFormTags: ['input', 'select', 'textarea'],
  });

  // Search notes (Cmd/Ctrl + F)
  useHotkeys('mod+f', (e) => {
    e.preventDefault();
    // Focus search input if it exists
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      toast.info('Search is available in the dashboard');
    }
  }, {
    enableOnFormTags: false,
  });

  // Delete current note (Cmd/Ctrl + Delete)
  useHotkeys('mod+delete', (e) => {
    e.preventDefault();
    // Trigger delete event that the note editor will listen to
    window.dispatchEvent(new CustomEvent('delete-note'));
  }, {
    enableOnFormTags: false,
  });

  // Quick note switcher (Cmd/Ctrl + K)
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setShowQuickSwitcher(true);
  }, {
    enableOnFormTags: false,
  });

  // Show keyboard shortcuts help (Cmd/Ctrl + Shift + ?)
  useHotkeys('mod+shift+?', (e) => {
    e.preventDefault();
    setShowHelp(true);
  }, {
    enableOnFormTags: true,
  });

  // Close modals with Escape
  useHotkeys('escape', () => {
    if (showHelp) setShowHelp(false);
    if (showQuickSwitcher) setShowQuickSwitcher(false);
  }, {
    enableOnFormTags: true,
  });

  // Quick switcher functionality
  useEffect(() => {
    if (showQuickSwitcher) {
      // Fetch notes for quick switcher
      fetch('/api/notes')
        .then(res => res.json())
        .then(data => {
          // Will implement actual quick switcher UI later
          console.log('Notes for quick switcher:', data.notes);
        })
        .catch(err => {
          console.error('Failed to fetch notes:', err);
        });
    }
  }, [showQuickSwitcher]);

  return (
    <>
      {children}
      
      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and manage your notes efficiently.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Switcher Dialog */}
      <Dialog open={showQuickSwitcher} onOpenChange={setShowQuickSwitcher}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quick Note Switcher</DialogTitle>
            <DialogDescription>
              Jump to any note quickly by typing its name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              autoFocus
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Quick switcher coming soon...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}