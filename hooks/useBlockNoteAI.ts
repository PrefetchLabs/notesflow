import { useCreateBlockNote } from "@blocknote/react";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { openai } from "@ai-sdk/openai";
import { defaultBlockSpecs } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";

const model = openai("gpt-4o-mini");

export function useBlockNoteAI(initialContent?: any[]) {
  const editor = useCreateBlockNote({
    initialContent,
    dictionary: {
      ...en,
      ai: aiEn // add default translations for the AI extension
    },
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
  });

  return editor;
}