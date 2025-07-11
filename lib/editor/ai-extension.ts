import { createAIExtension as createBlockNoteAIExtension, AIExtension, getAIExtension as getBlockNoteAIExtension } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import { checkAIUsageLimit, trackAIUsage } from "@/app/actions/ai";
import { toast } from "sonner";

type AIExtensionOptions = ConstructorParameters<typeof AIExtension>[1];

// Store AI extension instances for custom retrieval
const aiExtensionMap = new WeakMap<BlockNoteEditor, AIExtension>();

// Custom getAIExtension that works with our wrapped extension
export function getAIExtension(editor: BlockNoteEditor): AIExtension | null {
  // First try to get from our map
  const customExtension = aiExtensionMap.get(editor);
  if (customExtension) {
    return customExtension;
  }
  
  // Fallback to BlockNote's default
  try {
    return getBlockNoteAIExtension(editor);
  } catch (error) {
    console.error('[AI Extension] Failed to get AI extension:', error);
    return null;
  }
}

// Create a custom AI extension that wraps the BlockNote AI extension
export function createAIExtension(options: AIExtensionOptions) {
  // Return the extension directly for BlockNote to use
  const originalExtensionCreator = createBlockNoteAIExtension(options);
  
  return (editor: BlockNoteEditor) => {
    console.log('[AI Extension] Creating AI extension with options:', options);
    const baseExtension = originalExtensionCreator(editor);
    console.log('[AI Extension] Base extension created:', baseExtension);
    
    // Store the extension in our map
    aiExtensionMap.set(editor, baseExtension);
    
    // Store the original callLLM method
    const originalCallLLM = baseExtension.callLLM.bind(baseExtension);
    
    // Override the callLLM method to add usage tracking
    baseExtension.callLLM = async (opts) => {
      console.log('[AI Extension] callLLM called with:', opts);
      try {
        // Check usage limit first
        const usageCheck = await checkAIUsageLimit();
        
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
        if (usageCheck.remainingCalls <= 3 && usageCheck.remainingCalls > 0) {
          toast.warning(`${usageCheck.remainingCalls} AI calls remaining this month`);
        }

        // Make the actual LLM call
        console.log('[AI Extension] Making LLM call...');
        const result = await originalCallLLM(opts);
        console.log('[AI Extension] LLM call result:', result);

        // Track usage after successful call
        if (result) {
          await trackAIUsage(opts.userPrompt || "unknown", 0);
        }

        return result;
      } catch (error) {
        console.error("[AI Extension] Error details:", {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          opts
        });
        
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