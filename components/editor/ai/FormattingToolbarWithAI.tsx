'use client';

import React from 'react';
import { useComponentsContext } from '@blocknote/react';
import { FormattingToolbar } from '@blocknote/mantine';
import { getAIExtension } from '@blocknote/xl-ai';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function FormattingToolbarWithAI() {
  const Components = useComponentsContext()!;

  const customComponents = {
    ...Components,
    FormattingToolbar: (props: any) => {
      const { editor } = props;

      const handleAIClick = () => {
        const aiExtension = getAIExtension(editor);
        if (editor.getSelection()) {
          // Get the currently selected block
          const textCursorPosition = editor.getTextCursorPosition();
          if (textCursorPosition?.block) {
            aiExtension.openAIMenuAtBlock(textCursorPosition.block.id);
          }
        }
      };

      return (
        <Components.FormattingToolbar.Root {...props}>
          <Components.FormattingToolbar.Button onClick={handleAIClick}>
            <Sparkles className="h-4 w-4 mr-1" />
            AI
          </Components.FormattingToolbar.Button>
          {props.children}
        </Components.FormattingToolbar.Root>
      );
    },
  };

  return <FormattingToolbar key="FormattingToolbarWithAI" />;
}