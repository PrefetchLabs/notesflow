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
import { getAIExtension } from '@blocknote/xl-ai';
import { Sparkles } from 'lucide-react';
import { AIDropdownMenu } from './AIDropdownMenu';
import { toast } from 'sonner';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { ProBadge } from '@/components/ui/pro-badge';

export function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={(props) => {
        const [showAIMenu, setShowAIMenu] = useState(false);
        const aiButtonRef = useRef<HTMLButtonElement>(null);
        const { editor: fullEditor } = props;
        const { isPro, showUpgradePrompt } = useSubscription();

        const handleAIClick = () => {
          if (!isPro) {
            showUpgradePrompt('AI Assistant', 'Upgrade to Pro to use AI-powered writing assistance');
            return;
          }
          setShowAIMenu(!showAIMenu);
        };

        const handleAICommand = async (command: string) => {
          setShowAIMenu(false);
          
          try {
            // Use the full editor instance
            let aiExtension;
            try {
              aiExtension = getAIExtension(fullEditor);
            } catch (error) {
              console.error('Error getting AI extension:', error);
              toast.error('AI extension not available');
              return;
            }
            
            if (!aiExtension) {
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
              console.error('Unknown command:', command);
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
            console.error('Error executing AI command:', error);
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
            <div className="relative inline-flex items-center">
              <button
                ref={aiButtonRef}
                className={`bn-button ${!isPro ? 'opacity-60' : ''}`}
                onClick={handleAIClick}
                title={isPro ? "AI Assistant" : "AI Assistant (Pro feature)"}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              {!isPro && (
                <div className="absolute -top-2 -right-2 pointer-events-none">
                  <ProBadge size="sm" showIcon={false} />
                </div>
              )}
            </div>
            
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