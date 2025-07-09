'use client';

import React from 'react';
import { 
  FormattingToolbarController,
  FormattingToolbar,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton
} from '@blocknote/react';
import { getAIExtension } from '@blocknote/xl-ai';
import { Sparkles } from 'lucide-react';

export function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={(props) => {
        const { editor } = props;

        const handleAIClick = () => {
          try {
            // Simplest approach: insert /ai to trigger the AI menu
            if (editor.getSelection()) {
              // Save current selection
              const selection = editor.getSelection();
              
              // Clear selection to insert /ai command
              editor.focus();
              
              // Insert /ai at the current position to trigger AI menu
              editor.insertText('/ai ');
              
              // The AI menu should appear automatically
            } else {
              // No selection, just insert /ai at cursor
              editor.focus();
              editor.insertText('/ai ');
            }
          } catch (error) {
            console.error('AI button error:', error);
          }
        };

        return (
          <FormattingToolbar>
            <BlockTypeSelect />
            
            <BasicTextStyleButton basicTextStyle="bold" />
            <BasicTextStyleButton basicTextStyle="italic" />
            <BasicTextStyleButton basicTextStyle="underline" />
            <BasicTextStyleButton basicTextStyle="strike" />
            <BasicTextStyleButton basicTextStyle="code" />
            
            <TextAlignButton textAlignment="left" />
            <TextAlignButton textAlignment="center" />
            <TextAlignButton textAlignment="right" />
            
            <ColorStyleButton />
            
            <NestBlockButton />
            <UnnestBlockButton />
            
            <CreateLinkButton />
            
            {/* AI Button */}
            <button
              className="bn-button"
              onClick={handleAIClick}
              title="AI Assistant"
              type="button"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </FormattingToolbar>
        );
      }}
    />
  );
}