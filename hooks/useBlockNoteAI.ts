import { useCreateBlockNote } from "@blocknote/react";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { defaultBlockSpecs } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { llmFormats } from "@blocknote/xl-ai";
import "@blocknote/xl-ai/style.css";
import { createCustomAIModel } from "@/lib/ai/blocknote-ai-model";

export function useBlockNoteAI(initialContent?: any[]) {
  // Create model instance inside the function to ensure it's available
  const model = createCustomAIModel();
  
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
        dataFormat: llmFormats.html,
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