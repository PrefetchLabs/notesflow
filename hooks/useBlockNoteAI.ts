import { useCreateBlockNote } from "@blocknote/react";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { openai } from "@ai-sdk/openai";
import { defaultBlockSpecs } from "@blocknote/core";

const model = openai("gpt-4o-mini");

export function useBlockNoteAI(initialContent?: any[]) {
  const editor = useCreateBlockNote({
    initialContent,
    extensions: [
      createAIExtension({
        model,
        stream: true,
        dataFormat: "html",
        agentCursor: {
          name: "AI",
          color: "#8bc6ff"
        }
      })
    ],
    blockSpecs: {
      ...defaultBlockSpecs,
    },
    // Disable default toolbars as we'll use custom ones with AI
    // slashMenu: false,
    // formattingToolbar: false,
  });

  return editor;
}