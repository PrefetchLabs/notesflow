'use client';

import React from 'react';
import { FormattingToolbarController } from '@blocknote/react';
import { getAIExtension } from '@blocknote/xl-ai';
import { Sparkles } from 'lucide-react';

export function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={(props) => {
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
          <div className="bn-formatting-toolbar">
            <button
              className="bn-toolbar-button"
              onClick={handleAIClick}
              title="AI Assistant"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            {/* Add default formatting buttons here if needed */}
          </div>
        );
      }}
    />
  );
}