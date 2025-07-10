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
import { useAuth } from "@/lib/auth/auth-context";
import { useAnonymousAuth } from "@/lib/auth/anonymous-auth-context";

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
  // Try to get user from regular auth first, then anonymous auth
  let user: any;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch {
    // If regular auth fails, try anonymous auth
    try {
      const anonContext = useAnonymousAuth();
      user = anonContext.user;
    } catch {
      user = null;
    }
  }
  const [isConnected, setIsConnected] = useState(false);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SupabaseProvider | null>(null);

  // Initialize Y.Doc and provider
  useEffect(() => {
    if (!user || !noteId) return;

    // Create Y.Doc if not exists
    if (!docRef.current) {
      docRef.current = new Y.Doc();
    }

    // Create provider if not exists
    if (!providerRef.current) {
      const color = userColor || generateUserColor();
      
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
        setIsConnected(connected);
      });

      return () => {
        unsubscribe();
        providerRef.current?.disconnect();
        providerRef.current = null;
      };
    }
  }, [user, noteId, userColor]);

  // Create model instance outside of effect
  const model = createCustomAIModel();

  // Create editor with collaboration
  const editor = useCreateBlockNote({
    initialContent,
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
    collaboration: docRef.current && providerRef.current && user ? {
      provider: providerRef.current as any, // Cast to any for now since our custom provider doesn't match the exact WebSocket provider interface
      fragment: docRef.current.getXmlFragment("document-store"),
      user: {
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        color: userColor || generateUserColor(),
      },
      showCursorLabels,
    } : undefined,
  }, [noteId, user?.id]); // Re-create editor when noteId or user changes

  return {
    editor,
    isConnected,
    provider: providerRef.current,
    awareness: providerRef.current?.getAwareness(),
  };
}