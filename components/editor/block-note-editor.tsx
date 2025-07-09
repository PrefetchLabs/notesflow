'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useEffect, useState, useCallback } from 'react';

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
    initialContent: initialContent || undefined,
  });

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle content changes
  const handleEditorChange = useCallback(() => {
    if (onContentChange && editor) {
      // Get the document which is an array of blocks
      const document = editor.document;
      console.log('BlockNote onChange - document:', JSON.stringify(document, null, 2));
      // Pass the entire document array
      onContentChange(document);
    }
  }, [editor, onContentChange]);

  // Set up onChange handler
  useEffect(() => {
    if (!editor || !mounted) return;

    console.log('Setting up BlockNote onChange handler');
    
    // Register the onChange callback
    const unsubscribe = editor.onChange(handleEditorChange);

    // Return cleanup function
    return () => {
      console.log('Cleaning up BlockNote onChange handler');
      unsubscribe();
    };
  }, [editor, handleEditorChange, mounted]);

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