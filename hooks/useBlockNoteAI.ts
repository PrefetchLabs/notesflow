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
import { useTheme } from "next-themes";
import { useMemo } from "react";

export function useBlockNoteAI(initialContent?: Block[]) {
  // Create model instance inside the function to ensure it's available
  const model = useMemo(() => createCustomAIModel(), []);
  const { resolvedTheme } = useTheme();
  
  // Create extensions with theme-aware colors
  const extensions = useMemo(() => [
    createAIExtension({
      model,
      stream: true,
      dataFormat: llmFormats.html,
      agentCursor: {
        name: "AI",
        color: resolvedTheme === 'dark' ? "#60d5ff" : "#8bc6ff"
      }
    })
  ], [model, resolvedTheme]);
  
  const editor = useCreateBlockNote({
    initialContent,
    dictionary: {
      ...en,
      ai: aiEn // add default translations for the AI extension
    },
    extensions,
    blockSpecs: {
      ...defaultBlockSpecs,
    },
    codeBlock: {
      ...codeBlock,
      defaultLanguage: "javascript",
      indentLineWithTab: true,
    },
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
    pasteHandler: async ({ event, editor, defaultPasteHandler }) => {
      // Check if we're inside a table cell
      const currentBlock = editor.getTextCursorPosition().block;
      
      // Check if current block or any parent is a table
      let isInTable = false;
      let checkBlock = currentBlock;
      while (checkBlock) {
        if (checkBlock.type === 'table') {
          isInTable = true;
          break;
        }
        // Check parent blocks (for nested structures)
        const parentId = (checkBlock as any).parentId;
        if (!parentId) break;
        checkBlock = editor.getBlock(parentId);
      }
      
      // If we're in a table, use default paste behavior
      if (isInTable) {
        return defaultPasteHandler();
      }
      
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