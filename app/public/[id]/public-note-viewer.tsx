'use client';

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Block } from "@blocknote/core";

interface PublicNoteViewerProps {
  noteId: string;
  content: Block[] | null;
  title: string;
}

export function PublicNoteViewer({ noteId, content, title }: PublicNoteViewerProps) {
  // Create a read-only editor
  const editor = useCreateBlockNote({
    initialContent: content || undefined,
  });

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border">
      <div className="p-8">
        <BlockNoteView 
          editor={editor} 
          editable={false} // Read-only mode
          theme="light"
        />
      </div>
      <div className="border-t px-8 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        <p className="text-sm text-muted-foreground text-center">
          This note is shared in view-only mode. To collaborate on notes, please create an account.
        </p>
      </div>
    </div>
  );
}