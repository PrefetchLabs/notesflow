'use client';

import React from 'react';
import { AIMenu, getDefaultAIMenuItems } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import {
  continueWriting,
  improveClarity,
  summarize,
  extractTasks,
  makeInformal,
  makeFormal,
  quickFix,
} from './aiCommands';

export function CustomAIMenu(props: any) {
  return (
    <AIMenu
      {...props}
      items={(
        editor: BlockNoteEditor<any, any, any>,
        aiResponseStatus:
          | "user-input"
          | "thinking"
          | "ai-writing"
          | "error"
          | "user-reviewing"
          | "closed",
      ) => {
        console.log('[CustomAIMenu] Status:', aiResponseStatus, 'Editor:', editor);
        console.log('[CustomAIMenu] Has selection:', !!editor.getSelection());
        console.log('[CustomAIMenu] Selection:', editor.getSelection());
        
        if (aiResponseStatus === "user-input") {
          const defaultItems = getDefaultAIMenuItems(editor, aiResponseStatus);
          console.log('[CustomAIMenu] Default items:', defaultItems);
          
          if (editor.getSelection()) {
            // When text is selected, show all custom commands
            const customItems = [
              improveClarity(editor),
              quickFix(editor),
              summarize(editor),
              extractTasks(editor),
              makeInformal(editor),
              makeFormal(editor),
              ...defaultItems,
            ];
            console.log('[CustomAIMenu] Returning custom items for selection:', customItems);
            return customItems;
          } else {
            // When no text is selected, filter out default "Continue Writing" to avoid duplicate
            const filteredDefaultItems = defaultItems.filter(
              item => item.key !== 'continue_writing' && item.key !== 'Continue Writing'
            );
            const noSelectionItems = [
              continueWriting(editor),
              ...filteredDefaultItems,
            ];
            console.log('[CustomAIMenu] Returning items for no selection:', noSelectionItems);
            return noSelectionItems;
          }
        }

        // For other states, return the default items
        const otherStateItems = getDefaultAIMenuItems(editor, aiResponseStatus);
        console.log('[CustomAIMenu] Returning default items for status:', aiResponseStatus, otherStateItems);
        return otherStateItems;
      }}
    />
  );
}