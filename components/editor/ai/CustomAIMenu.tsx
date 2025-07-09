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

export function CustomAIMenu() {
  try {
    return (
      <AIMenu
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
            // When no text is selected, show continue writing and other commands
            return [
              continueWriting(editor),
              ...defaultItems,
            ];
          }
        }

        // For other states, return the default items
        return getDefaultAIMenuItems(editor, aiResponseStatus);
      }}
    />
    );
  } catch (error) {
    console.error('Error rendering AI Menu:', error);
    return null;
  }
}