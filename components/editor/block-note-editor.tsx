'use client';

import { BlockNoteEditor } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface BlockNoteEditorProps {
  initialContent?: any;
  onContentChange?: (content: any) => void;
  editable?: boolean;
}

export function BlockNoteEditorComponent({
  initialContent,
  onContentChange,
  editable = true,
}: BlockNoteEditorProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Create the editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
  });

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle onChange directly on BlockNoteView
  const handleChange = () => {
    if (!editor) return;
    
    const document = editor.document;
    
    if (onContentChange) {
      onContentChange(document);
    }
  };

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      className="h-full"
      onChange={handleChange}
    />
  );
}