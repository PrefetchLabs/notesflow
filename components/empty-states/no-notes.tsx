'use client';

import { FileText, Sparkles } from 'lucide-react';
import { EmptyState } from './empty-state';

interface NoNotesProps {
  onCreateNote: () => void;
  folderName?: string;
}

export function NoNotes({ onCreateNote, folderName }: NoNotesProps) {
  return (
    <EmptyState
      icon={FileText}
      title={folderName ? `No notes in ${folderName}` : "No notes yet"}
      description={
        folderName
          ? "This folder is empty. Create a note to get started."
          : "Start capturing your thoughts, ideas, and knowledge. Your first note is just a click away."
      }
      action={{
        label: "Create a note",
        onClick: onCreateNote,
      }}
    />
  );
}