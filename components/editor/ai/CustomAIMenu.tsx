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
        if (aiResponseStatus === "user-input") {
          const defaultItems = getDefaultAIMenuItems(editor, aiResponseStatus);
          
          if (editor.getSelection()) {
            // When text is selected, show all custom commands
            return [
              improveClarity(editor),
              quickFix(editor),
              summarize(editor),
              extractTasks(editor),
              makeInformal(editor),
              makeFormal(editor),
              ...defaultItems,
            ];
          } else {
            // When no text is selected, filter out default "Continue Writing" to avoid duplicate
            const filteredDefaultItems = defaultItems.filter(
              item => item.key !== 'continue_writing' && item.key !== 'Continue Writing'
            );
            return [
              continueWriting(editor),
              ...filteredDefaultItems,
            ];
          }
        }

        // For other states, return the default items
        return getDefaultAIMenuItems(editor, aiResponseStatus);
      }}
    />
  );
}