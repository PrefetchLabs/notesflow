import { useCreateBlockNote } from "@blocknote/react";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { defaultBlockSpecs, Block } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { llmFormats } from "@blocknote/xl-ai";
import "@blocknote/xl-ai/style.css";
import { createCustomAIModel } from "@/lib/ai/blocknote-ai-model";
import { preprocessPastedHTML, enhanceBlocksFormatting } from "@/lib/editor/paste-utils";
import { codeBlock } from "@blocknote/code-block";

export function useBlockNoteAI(initialContent?: Block[]) {
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
    codeBlock: {
      ...codeBlock,
      defaultLanguage: "javascript",
      indentLineWithTab: true,
    },
    pasteHandler: async ({ event, editor, defaultPasteHandler }) => {
      // Check if clipboard contains HTML
      const html = event.clipboardData?.getData('text/html');
      
      if (html) {
        try {
          // First preprocess the HTML to handle separators
          const processedHTML = preprocessPastedHTML(html);
          
          // Parse HTML into BlockNote blocks
          const blocks = await editor.tryParseHTMLToBlocks(processedHTML);
          
          // Enhance blocks with proper formatting
          const processedBlocks = enhanceBlocksFormatting(blocks);
          
          // Get current block position
          const currentBlock = editor.getTextCursorPosition().block;
          
          // Insert the parsed blocks
          editor.insertBlocks(processedBlocks, currentBlock, "after");
          
          // Remove the current block if it's empty
          if (!currentBlock.content || currentBlock.content.length === 0) {
            editor.removeBlocks([currentBlock]);
          }
          
          return true;
        } catch (error) {
          console.error('Error parsing pasted HTML:', error);
          // Fall back to default handler on error
          return defaultPasteHandler();
        }
      }
      
      // Fall back to default paste handler for non-HTML content
      return defaultPasteHandler();
    },
  });

  return editor;
}