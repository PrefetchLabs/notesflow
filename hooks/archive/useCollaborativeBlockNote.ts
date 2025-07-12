import { useCreateBlockNote } from "@blocknote/react";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { defaultBlockSpecs } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { llmFormats } from "@blocknote/xl-ai";
import "@blocknote/xl-ai/style.css";
import { createCustomAIModel } from "@/lib/ai/blocknote-ai-model";
import * as Y from "yjs";
import { SupabaseProvider } from "@/lib/collaboration/supabase-yjs-provider";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-hooks";

export interface CollaborativeBlockNoteOptions {
  initialContent?: any[];
  noteId: string;
  userColor?: string;
  showCursorLabels?: "always" | "activity";
}

// Generate a random color for the user if not provided
function generateUserColor(): string {
  const colors = [
    "#ff6b6b", // Red
    "#4ecdc4", // Teal
    "#45b7d1", // Blue
    "#96ceb4", // Green
    "#feca57", // Yellow
    "#dfe6e9", // Gray
    "#fd79a8", // Pink
    "#a29bfe", // Purple
    "#6c5ce7", // Dark Purple
    "#00b894", // Emerald
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useCollaborativeBlockNote({
  initialContent,
  noteId,
  userColor,
  showCursorLabels = "activity"
}: CollaborativeBlockNoteOptions) {
  // Get user from auth context
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SupabaseProvider | null>(null);
  
  // [REMOVED_CONSOLE]

  // Initialize Y.Doc and provider
  useEffect(() => {
    // [REMOVED_CONSOLE]
    if (!user || !noteId) {
      // [REMOVED_CONSOLE]
      return;
    }

    // Create Y.Doc if not exists
    if (!docRef.current) {
      // [REMOVED_CONSOLE]
      docRef.current = new Y.Doc();
    }

    // Create provider if not exists
    if (!providerRef.current) {
      const color = userColor || generateUserColor();
      // [REMOVED_CONSOLE]
      
      providerRef.current = new SupabaseProvider(docRef.current, {
        noteId,
        user: {
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Anonymous',
          color,
        },
      });

      // Listen to connection changes
      const unsubscribe = providerRef.current.onConnectionChange((connected) => {
        // [REMOVED_CONSOLE]
        setIsConnected(connected);
      });

      // Mark as initialized once provider is created
      setIsInitialized(true);

      return () => {
        // [REMOVED_CONSOLE]
        unsubscribe();
        providerRef.current?.disconnect();
        providerRef.current = null;
        docRef.current = null;
        setIsInitialized(false);
      };
    } else if (providerRef.current && user) {
      // Provider already exists, just update initialized state
      setIsInitialized(true);
    }
  }, [user, noteId, userColor]);

  // Create model instance outside of effect
  const model = createCustomAIModel();

  // Only pass initialContent if we're NOT in collaborative mode
  // In collaborative mode, content comes from the Y.Doc
  const shouldUseCollaboration = isInitialized && docRef.current && providerRef.current && user;
  
  // Create editor with collaboration
  const editor = useCreateBlockNote({
    // Only use initialContent if NOT collaborating
    ...(shouldUseCollaboration ? {} : { initialContent }),
    dictionary: {
      ...en,
      ai: aiEn
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
    collaboration: shouldUseCollaboration ? {
      provider: providerRef.current as any,
      fragment: docRef.current.getXmlFragment("document-store"),
      user: {
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        color: userColor || generateUserColor(),
      },
      showCursorLabels,
    } : undefined,
  }, [noteId, user?.id, isInitialized]); // Re-create editor when these change

  return {
    editor,
    isConnected,
    provider: providerRef.current,
    awareness: providerRef.current?.getAwareness(),
  };
}