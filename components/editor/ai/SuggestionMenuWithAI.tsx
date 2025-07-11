'use client';

import React from 'react';
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { getAIExtension } from '@blocknote/xl-ai';
import { Sparkles } from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';

export function SuggestionMenuWithAI({ editor }: { editor: BlockNoteEditor }) {
  const aiMenuItem = {
    title: "AI Assistant",
    subtext: "Use AI to help write",
    onItemClick: () => {
      try {
        console.log('[AI Menu] Attempting to open AI menu...');
        const textCursorPosition = editor.getTextCursorPosition();
        console.log('[AI Menu] Text cursor position:', textCursorPosition);
        
        if (textCursorPosition?.block) {
          const aiExtension = getAIExtension(editor);
          console.log('[AI Menu] AI extension:', aiExtension);
          
          if (aiExtension) {
            console.log('[AI Menu] Opening AI menu at block:', textCursorPosition.block.id);
            aiExtension.openAIMenuAtBlock(textCursorPosition.block.id);
          } else {
            console.error('[AI Menu] AI extension not available - make sure you have Pro access');
          }
        } else {
          console.error('[AI Menu] No text cursor position found');
        }
      } catch (error) {
        console.error('[AI Menu] Error opening AI menu:', error);
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