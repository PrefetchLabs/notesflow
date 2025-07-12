'use client';

import React from 'react';
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { Sparkles } from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';
import { getAIExtension } from '@/lib/editor/ai-extension';
import { toast } from 'sonner';

export function SuggestionMenuWithAI({ editor }: { editor: BlockNoteEditor }) {
  const aiMenuItem = {
    title: "AI Assistant",
    subtext: "Use AI to help write",
    onItemClick: () => {
      try {
        // [REMOVED_CONSOLE]
        const textCursorPosition = editor.getTextCursorPosition();
        // [REMOVED_CONSOLE]
        
        if (textCursorPosition?.block) {
          const aiExtension = getAIExtension(editor);
          // [REMOVED_CONSOLE]
          
          if (aiExtension) {
            // [REMOVED_CONSOLE]
            aiExtension.openAIMenuAtBlock(textCursorPosition.block.id);
          } else {
            // [REMOVED_CONSOLE]
            toast.error('AI features are only available for Beta and Pro users', {
              action: {
                label: 'Upgrade to Pro',
                onClick: () => window.location.href = '/upgrade'
              }
            });
          }
        } else {
          // [REMOVED_CONSOLE]
        }
      } catch (error) {
        // [REMOVED_CONSOLE]
      }
    },
    aliases: ["ai", "assistant", "help"],
    group: "AI",
    icon: <Sparkles className="h-4 w-4" />,
  };

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        
        // Add AI item at the beginning
        const allItems = [aiMenuItem, ...defaultItems];
        
        // Filter items based on query
        return allItems.filter(
          (item) => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.aliases?.some((alias) => 
              alias.toLowerCase().includes(query.toLowerCase())
            )
        );
      }}
    />
  );
}