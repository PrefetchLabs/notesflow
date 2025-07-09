'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState } from 'react';

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

  // Create the editor instance with onChange handler
  const editor = useCreateBlockNote({
    initialContent: initialContent || undefined,
    uploadFile: async () => {
      // Placeholder for file upload
      return '';
    },
  });

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set up onChange handler
  useEffect(() => {
    if (!editor || !onContentChange) return;

    const handleChange = () => {
      const content = editor.document;
      console.log('Editor content changed:', JSON.stringify(content, null, 2));
      onContentChange(content);
    };

    // Subscribe to changes
    const unsubscribe = editor.onChange(handleChange);

    // Return cleanup function
    return () => {
      unsubscribe();
    };
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