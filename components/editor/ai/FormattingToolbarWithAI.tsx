'use client';

import React, { useState, useRef } from 'react';
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
import { Sparkles } from 'lucide-react';
import { AIDropdownMenu } from './AIDropdownMenu';
import { toast } from 'sonner';
import { getAIExtension } from '@/lib/editor/ai-extension';

interface FormattingToolbarWithAIProps {
  editor?: any;
}

export function FormattingToolbarWithAI({ editor: passedEditor }: FormattingToolbarWithAIProps) {
  return (
    <FormattingToolbarController
      formattingToolbar={(props) => {
        const [showAIMenu, setShowAIMenu] = useState(false);
        const aiButtonRef = useRef<HTMLButtonElement>(null);
        const { editor: propsEditor } = props;
        // Use passed editor if available, otherwise fall back to props editor
        const fullEditor = passedEditor || propsEditor;
        
        console.log('[AI Debug] FormattingToolbar props:', props);
        console.log('[AI Debug] Editor from props:', propsEditor);
        console.log('[AI Debug] Passed editor:', passedEditor);
        console.log('[AI Debug] Using editor:', fullEditor);

        const handleAIClick = () => {
          setShowAIMenu(!showAIMenu);
        };

        const handleAICommand = async (command: string) => {
          setShowAIMenu(false);
          
          try {
            // Check if editor is available
            if (!fullEditor) {
              console.error('[AI Debug] Editor is not available');
              toast.error('Editor not ready');
              return;
            }
            
            // Use the full editor instance
            let aiExtension;
            try {
              console.log('[AI Debug] Getting AI extension for command:', command);
              console.log('[AI Debug] Editor instance:', fullEditor);
              aiExtension = getAIExtension(fullEditor);
              console.log('[AI Debug] AI extension retrieved:', aiExtension);
            } catch (error) {
              console.error('[AI Debug] Error getting AI extension:', error);
              toast.error('AI extension not available');
              return;
            }
            
            if (!aiExtension) {
              console.error('[AI Debug] AI extension is null/undefined');
              toast.error('AI extension not available');
              return;
            }
            
            // For edit-selection, open the AI menu for custom input
            if (command === 'edit-selection') {
              const textCursorPosition = fullEditor.getTextCursorPosition();
              if (textCursorPosition?.block) {
                aiExtension.openAIMenuAtBlock(textCursorPosition.block.id);
              }
              return;
            }
            
            // Check if we need text selection
            const needsSelection = ['improve', 'fix-grammar', 'translate', 'shorten', 'simplify', 'change-tone'].includes(command);
            const selection = fullEditor.getSelection();
            const hasSelection = selection && selection.blocks.length > 0;
            
            // Configure prompts and settings for each command
            const commandConfigs: Record<string, { 
              prompt: string; 
              useSelection: boolean;
              streamTools: { add: boolean; update: boolean; delete: boolean };
            }> = {
              'improve': {
                prompt: hasSelection 
                  ? 'Improve the writing style and clarity of the selected text. Make it more engaging and professional.'
                  : 'Continue writing in an improved style',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: !hasSelection, update: hasSelection, delete: false }
              },
              'fix-grammar': {
                prompt: hasSelection
                  ? 'Fix all grammar and spelling mistakes in the selected text. Keep the meaning unchanged.'
                  : 'Fix grammar and spelling in the text above',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'translate': {
                prompt: hasSelection
                  ? 'Translate the selected text to Spanish. Keep the tone and style.'
                  : 'Translate the text above to Spanish',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'shorten': {
                prompt: hasSelection
                  ? 'Make the selected text shorter and more concise while keeping all key points.'
                  : 'Shorten the text above',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'extend': {
                prompt: hasSelection
                  ? 'Expand the selected text with more details and examples. Keep the same tone.'
                  : 'Continue writing with more details',
                useSelection: false, // Always add content for extend
                streamTools: { add: true, update: false, delete: false }
              },
              'simplify': {
                prompt: hasSelection
                  ? 'Simplify the selected text to make it easier to understand. Use simpler words and shorter sentences.'
                  : 'Simplify the text above',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be more professional and formal.'
                  : 'Change the tone of the text above to be more professional',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              }
            };
            
            const config = commandConfigs[command];
            if (!config) {
              // [REMOVED_CONSOLE]
              return;
            }
            
            // If we need selection but don't have it, show error
            if (needsSelection && !hasSelection) {
              toast.error('Please select some text first');
              return;
            }
            
            // Execute the AI command directly
            await aiExtension.callLLM({
              userPrompt: config.prompt,
              useSelection: config.useSelection,
              defaultStreamTools: config.streamTools,
            });
            
          } catch (error) {
            // [REMOVED_CONSOLE]
            toast.error('Failed to execute AI command');
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
              ref={aiButtonRef}
              className="bn-button"
              onClick={handleAIClick}
              title="AI Assistant"
              type="button"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            
            {showAIMenu && (
              <AIDropdownMenu
                onCommand={handleAICommand}
                onClose={() => setShowAIMenu(false)}
                anchorRef={aiButtonRef}
              />
            )}
          </FormattingToolbar>
        );
      }}
    />
  );
}