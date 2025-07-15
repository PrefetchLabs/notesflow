import { createAIExtension as createBlockNoteAIExtension, AIExtension, getAIExtension as getBlockNoteAIExtension } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import { checkAIUsageLimit, trackAIUsage } from "@/app/actions/ai";
import { toast } from "sonner";

type AIExtensionOptions = ConstructorParameters<typeof AIExtension>[1];

// Store AI extension instances for custom retrieval
const aiExtensionMap = new WeakMap<BlockNoteEditor, AIExtension>();

// Store active abort controllers for cancellation
const activeAbortControllers = new Map<string, AbortController>();

// Custom getAIExtension that works with our wrapped extension
export function getAIExtension(editor: BlockNoteEditor): AIExtension | null {
  // First try to get from our map
  const customExtension = aiExtensionMap.get(editor);
  if (customExtension) {
    return customExtension;
  }
  
  // Try to get the extension directly from the editor
  if (editor && editor._tiptapEditor && editor._tiptapEditor.extensionManager) {
    const extensions = editor._tiptapEditor.extensionManager.extensions;
    const aiExt = extensions.find((ext: any) => ext.name === 'ai' || ext.name === 'aiExtension');
    if (aiExt && aiExt.options && typeof aiExt.options.callLLM === 'function') {
      // Return a compatible object
      return aiExt.options as AIExtension;
    }
  }
  
  // Fallback to BlockNote's default
  try {
    if (!editor) {
      return null;
    }
    const defaultExt = getBlockNoteAIExtension(editor);
    return defaultExt;
  } catch (error) {
    return null;
  }
}

// Check if any AI operations are active
export function isAIActive() {
  return activeAbortControllers.size > 0;
}

// Cancel all active AI operations and return whether any were cancelled
export function cancelActiveAIOperations() {
  const hadActiveOperations = activeAbortControllers.size > 0;
  activeAbortControllers.forEach((controller, id) => {
    controller.abort();
  });
  activeAbortControllers.clear();
  return hadActiveOperations;
}

// Global ESC key handler for cancelling AI operations
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isAIActive()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const cancelled = cancelActiveAIOperations();
      if (cancelled) {
        toast.info('AI operation cancelled');
      }
    }
  }, true); // Use capture phase to intercept before any other handlers
}

// Create a custom AI extension that wraps the BlockNote AI extension
export function createAIExtension(options: AIExtensionOptions) {
  // Return the extension directly for BlockNote to use
  const originalExtensionCreator = createBlockNoteAIExtension(options);
  
  return (editor: BlockNoteEditor) => {
    const baseExtension = originalExtensionCreator(editor);
    
    // Store the extension in our map
    aiExtensionMap.set(editor, baseExtension);
    
    // Store the original callLLM method
    const originalCallLLM = baseExtension.callLLM.bind(baseExtension);
    
    // Override the callLLM method to add usage tracking
    baseExtension.callLLM = async (opts) => {
      // Create abort controller for this operation
      const operationId = `ai-${Date.now()}`;
      const abortController = new AbortController();
      activeAbortControllers.set(operationId, abortController);
      
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
        if (usageCheck.remainingCalls !== Infinity && usageCheck.remainingCalls <= 10 && usageCheck.remainingCalls > 0) {
          toast.warning(`${usageCheck.remainingCalls} AI calls remaining this month`);
        }

        // Make the actual LLM call with abort signal
        const result = await originalCallLLM({
          ...opts,
          signal: abortController.signal
        });

        // Track usage after successful call (but don't let tracking failures break AI)
        if (result) {
          try {
            const trackingResult = await trackAIUsage(opts.userPrompt || "unknown", 0);
          } catch (trackingError) {
            // Don't fail the AI request on tracking errors
          }
        }

        // Clean up abort controller after successful completion
        activeAbortControllers.delete(operationId);
        
        return result;
      } catch (error) {
        // Clean up abort controller on error
        activeAbortControllers.delete(operationId);
        
        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          // Toast is already shown by the global ESC handler
          return undefined;
        }
        
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