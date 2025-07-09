'use client';

import { FolderPlus } from 'lucide-react';
import { EmptyState } from './empty-state';

interface NoFoldersProps {
  onCreateFolder: () => void;
}

export function NoFolders({ onCreateFolder }: NoFoldersProps) {
  return (
    <EmptyState
      icon={FolderPlus}
      title="No folders yet"
      description="Organize your notes by creating your first folder. Folders help you keep related notes together."
      action={{
        label: "Create your first folder",
        onClick: onCreateFolder,
      }}
    />
  );
}