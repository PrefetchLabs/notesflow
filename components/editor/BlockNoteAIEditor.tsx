'use client';

import { BlockNoteView } from '@blocknote/mantine';
import { AIMenuController } from '@blocknote/xl-ai';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import '@blocknote/xl-ai/style.css';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useBlockNoteAI } from '@/hooks/useBlockNoteAI';
import { CustomAIMenu } from './ai/CustomAIMenu';
import { FormattingToolbarWithAI } from './ai/FormattingToolbarWithAI';
import { SuggestionMenuWithAI } from './ai/SuggestionMenuWithAI';
import { AIUsageIndicator } from './ai/AIUsageIndicator';

interface BlockNoteAIEditorProps {
  initialContent?: any;
  onContentChange?: (content: any) => void;
  editable?: boolean;
  showAIUsage?: boolean;
}

export function BlockNoteAIEditor({
  initialContent,
  onContentChange,
  editable = true,
  showAIUsage = true,
}: BlockNoteAIEditorProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Create the AI-enabled editor instance
  const editor = useBlockNoteAI(initialContent);

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
    <div className="h-full flex flex-col">
      {showAIUsage && (
        <div className="flex justify-end p-2 border-b">
          <AIUsageIndicator />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <BlockNoteView
          editor={editor}
          editable={editable}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          className="h-full overflow-y-auto"
          onChange={handleChange}
          formattingToolbar={false}
          slashMenu={false}
        >
          {/* Add the AI Command menu to the editor */}
          <AIMenuController aiMenu={CustomAIMenu} />

          {/* Custom Formatting Toolbar with AI button */}
          <FormattingToolbarWithAI editor={editor} />

          {/* Custom SlashMenu with AI option */}
          <SuggestionMenuWithAI editor={editor} />
        </BlockNoteView>
      </div>
    </div>
  );
}