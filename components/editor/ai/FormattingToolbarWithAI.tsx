'use client';

import React, { useState, useRef, useEffect } from 'react';
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

        const handleAIClick = (e: React.MouseEvent) => {
          // Prevent default to avoid losing editor focus
          e.preventDefault();
          e.stopPropagation();
          setShowAIMenu(!showAIMenu);
        };

        const handleAICommand = async (command: string, value?: string) => {
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
              aiExtension = getAIExtension(fullEditor);
            } catch (error) {
              toast.error('AI extension not available');
              return;
            }
            
            if (!aiExtension) {
              toast.error('AI extension not available');
              return;
            }
            
            
            // Check if we need text selection
            const needsSelection = [
              'improve', 'fix-grammar', 'translate', 'shorten', 'simplify', 'change-tone',
              'translate-korean', 'translate-english', 'translate-chinese', 'translate-japanese',
              'change-tone-professional', 'change-tone-casual', 'change-tone-friendly',
              'change-tone-persuasive', 'change-tone-academic', 'change-tone-creative'
            ].includes(command);
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
              'translate-korean': {
                prompt: hasSelection
                  ? 'Translate the selected text to Korean. Keep the tone and style.'
                  : 'Translate the text above to Korean',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'translate-english': {
                prompt: hasSelection
                  ? 'Translate the selected text to English. Keep the tone and style.'
                  : 'Translate the text above to English',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'translate-chinese': {
                prompt: hasSelection
                  ? 'Translate the selected text to Chinese (Simplified). Keep the tone and style.'
                  : 'Translate the text above to Chinese (Simplified)',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'translate-japanese': {
                prompt: hasSelection
                  ? 'Translate the selected text to Japanese. Keep the tone and style.'
                  : 'Translate the text above to Japanese',
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
              },
              'change-tone-professional': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be professional and formal for business communication.'
                  : 'Change the tone to be professional and formal',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone-casual': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be casual and relaxed.'
                  : 'Change the tone to be casual and relaxed',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone-friendly': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be friendly, warm, and approachable.'
                  : 'Change the tone to be friendly and warm',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone-persuasive': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be persuasive and convincing.'
                  : 'Change the tone to be persuasive',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone-academic': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be academic and scholarly with formal language.'
                  : 'Change the tone to be academic and scholarly',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'change-tone-creative': {
                prompt: hasSelection
                  ? 'Change the tone of the selected text to be creative, imaginative, and artistic.'
                  : 'Change the tone to be creative and imaginative',
                useSelection: needsSelection && hasSelection,
                streamTools: { add: false, update: true, delete: false }
              },
              'custom-prompt': {
                prompt: value || 'Help me with this text',
                useSelection: hasSelection,
                streamTools: { add: !hasSelection, update: hasSelection, delete: false }
              }
            };
            
            const config = commandConfigs[command];
            if (!config) {
              // [REMOVED_CONSOLE]
              return;
            }
            
            // If we need selection but don't have it, show error
            if (needsSelection && !hasSelection && command !== 'custom-prompt') {
              toast.error('Please select some text first');
              return;
            }
            
            // Execute the AI command directly
            await aiExtension.callLLM({
              userPrompt: config.prompt,
              useSelection: config.useSelection,
              defaultStreamTools: config.streamTools,
            });
            
            // Restore editor focus after AI operation completes
            // This ensures the formatting toolbar continues to work properly
            setTimeout(() => {
              if (fullEditor && fullEditor._tiptapEditor) {
                // Focus the editor
                fullEditor.focus();
                
                // Get current selection
                const { from, to } = fullEditor._tiptapEditor.state.selection;
                
                // Force a selection update to re-trigger formatting toolbar
                if (from === to) {
                  // No selection - create a small selection and then collapse it
                  // This forces the toolbar to re-evaluate
                  fullEditor._tiptapEditor.commands.setTextSelection({ from, to: from + 1 });
                  setTimeout(() => {
                    fullEditor._tiptapEditor.commands.setTextSelection({ from, to: from });
                  }, 10);
                } else {
                  // Re-set the existing selection to trigger formatting toolbar
                  fullEditor._tiptapEditor.commands.setTextSelection({ from, to });
                }
                
                // Dispatch a selection update event to ensure all listeners are notified
                fullEditor._tiptapEditor.emit('selectionUpdate', {
                  editor: fullEditor._tiptapEditor,
                  transaction: fullEditor._tiptapEditor.state.tr
                });
              }
            }, 100);
            
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
              className="bn-formatting-toolbar-button"
              onClick={handleAIClick}
              title="AI Assistant"
              type="button"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            
            {showAIMenu && (
              <AIDropdownMenu
                onCommand={handleAICommand}
                onClose={() => {
                  setShowAIMenu(false);
                  // Restore focus to the editor when menu closes
                  setTimeout(() => {
                    if (fullEditor) {
                      fullEditor.focus();
                    }
                  }, 50);
                }}
                anchorRef={aiButtonRef}
              />
            )}
          </FormattingToolbar>
        );
      }}
    />
  );
}