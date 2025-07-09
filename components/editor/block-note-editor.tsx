'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';
import { getDefaultReactSlashMenuItems } from '@blocknote/react';

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

  // Create the editor instance
  const editor = useCreateBlockNote({
    initialContent,
  });

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle content changes
  useEffect(() => {
    if (!editor || !onContentChange) return;

    const handleChange = () => {
      const content = editor.document;
      onContentChange(content);
    };

    editor.onChange(handleChange);
  }, [editor, onContentChange]);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      className="h-full"
    />
  );
}