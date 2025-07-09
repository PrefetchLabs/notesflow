import { createAIExtension as createBlockNoteAIExtension, AIExtensionOptions } from "@blocknote/xl-ai";
import { BlockNoteEditor } from "@blocknote/core";
import { checkAIUsageLimit, trackAIUsage } from "@/app/actions/ai";
import { toast } from "sonner";

export function createAIExtension(options: AIExtensionOptions) {
  return (editor: BlockNoteEditor) => {
    const baseExtension = createBlockNoteAIExtension(options)(editor);
    
    // Override the callLLM method to add usage tracking
    const originalCallLLM = baseExtension.callLLM.bind(baseExtension);
    
    baseExtension.callLLM = async (opts) => {
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
        const result = await originalCallLLM(opts);

        // Track usage after successful call
        if (result) {
          await trackAIUsage(opts.userPrompt || "unknown", 0);
        }

        return result;
      } catch (error) {
        console.error("AI Extension error:", error);
        
        if (error instanceof Error && error.message.includes("limit reached")) {
          // Already handled above
          return undefined;
        }
        
        toast.error("AI request failed", {
          description: "There was an error processing your AI request. Please try again.",
        });
        
        throw error;
      }
    };
    
    return baseExtension;
  };
}