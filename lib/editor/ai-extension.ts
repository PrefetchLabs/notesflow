import { createAIExtension as createBlockNoteAIExtension, AIExtension, getAIExtension as getBlockNoteAIExtension } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import { checkAIUsageLimit, trackAIUsage } from "@/app/actions/ai";
import { toast } from "sonner";

type AIExtensionOptions = ConstructorParameters<typeof AIExtension>[1];

// Store AI extension instances for custom retrieval
const aiExtensionMap = new WeakMap<BlockNoteEditor, AIExtension>();

// Custom getAIExtension that works with our wrapped extension
export function getAIExtension(editor: BlockNoteEditor): AIExtension | null {
  console.log('[AI Extension] Getting AI extension for editor:', editor);
  
  // First try to get from our map
  const customExtension = aiExtensionMap.get(editor);
  console.log('[AI Extension] Custom extension from map:', customExtension);
  if (customExtension) {
    return customExtension;
  }
  
  // Try to get the extension directly from the editor
  if (editor && editor._tiptapEditor && editor._tiptapEditor.extensionManager) {
    const extensions = editor._tiptapEditor.extensionManager.extensions;
    console.log('[AI Extension] All extensions:', extensions);
    const aiExt = extensions.find((ext: any) => ext.name === 'ai' || ext.name === 'aiExtension');
    console.log('[AI Extension] Found AI extension in editor:', aiExt);
    if (aiExt && aiExt.options && typeof aiExt.options.callLLM === 'function') {
      // Return a compatible object
      return aiExt.options as AIExtension;
    }
  }
  
  // Fallback to BlockNote's default
  try {
    if (!editor) {
      console.error('[AI Extension] Editor is undefined, cannot get AI extension');
      return null;
    }
    const defaultExt = getBlockNoteAIExtension(editor);
    console.log('[AI Extension] Default BlockNote extension:', defaultExt);
    return defaultExt;
  } catch (error) {
    console.error('[AI Extension] Error getting default extension:', error);
    return null;
  }
}

// Create a custom AI extension that wraps the BlockNote AI extension
export function createAIExtension(options: AIExtensionOptions) {
  console.log('[AI Extension] Creating AI extension with options:', options);
  
  // Return the extension directly for BlockNote to use
  const originalExtensionCreator = createBlockNoteAIExtension(options);
  
  return (editor: BlockNoteEditor) => {
    console.log('[AI Extension] Initializing AI extension for editor');
    const baseExtension = originalExtensionCreator(editor);
    
    // Store the extension in our map
    aiExtensionMap.set(editor, baseExtension);
    console.log('[AI Extension] Stored extension in WeakMap');
    
    // Store the original callLLM method
    const originalCallLLM = baseExtension.callLLM.bind(baseExtension);
    
    // Override the callLLM method to add usage tracking
    baseExtension.callLLM = async (opts) => {
      console.log('[AI Extension] callLLM called with options:', opts);
      try {
        // Check usage limit first
        const usageCheck = await checkAIUsageLimit();
        console.log('[AI Extension] Usage check result:', usageCheck);
        
        if (usageCheck.hasReachedLimit) {
          toast.error("AI usage limit reached", {
            description: "You've reached your monthly limit of AI calls. Upgrade to Pro for unlimited access.",
            action: {
              label: "Upgrade",
              onClick: () => {
                // TODO: Navigate to upgrade page
                window.location.href = "/upgrade";
              },
            },
          });
          return undefined;
        }

        // Show remaining calls if near limit
        if (usageCheck.remainingCalls !== Infinity && usageCheck.remainingCalls <= 10 && usageCheck.remainingCalls > 0) {
          toast.warning(`${usageCheck.remainingCalls} AI calls remaining this month`);
        }

        // Make the actual LLM call
        console.log('[AI Extension] Calling original LLM with opts:', opts);
        const result = await originalCallLLM(opts);
        console.log('[AI Extension] LLM call result:', result);

        // Track usage after successful call (but don't let tracking failures break AI)
        if (result) {
          try {
            // [REMOVED_CONSOLE]
            const trackingResult = await trackAIUsage(opts.userPrompt || "unknown", 0);
            // [REMOVED_CONSOLE]
          } catch (trackingError) {
            // Log the error but don't fail the AI request
            // [REMOVED_CONSOLE]
            // For Beta/Pro users, this shouldn't prevent AI from working
          }
        }

        return result;
      } catch (error) {
        // [REMOVED_CONSOLE]
        
        if (error instanceof Error) {
          if (error.message.includes("limit reached")) {
            // Already handled above
            return undefined;
          }
          
          // Handle authentication errors
          if (error.message.includes("not authenticated")) {
            toast.error("Authentication required", {
              description: "Please sign in to use AI features.",
            });
            return undefined;
          }
          
          // Handle API errors
          if (error.message.includes("403") || error.message.includes("Forbidden")) {
            toast.error("AI access denied", {
              description: "You don't have permission to use AI features.",
            });
            return undefined;
          }
        }
        
        toast.error("AI request failed", {
          description: error instanceof Error ? error.message : "There was an error processing your AI request. Please try again.",
        });
        
        return undefined;
      }
    };
    
    return baseExtension;
  };
}