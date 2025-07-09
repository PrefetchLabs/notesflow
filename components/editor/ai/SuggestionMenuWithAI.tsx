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
      const textCursorPosition = editor.getTextCursorPosition();
      if (textCursorPosition?.block) {
        const aiExtension = getAIExtension(editor);
        aiExtension.openAIMenuAtBlock(textCursorPosition.block.id);
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