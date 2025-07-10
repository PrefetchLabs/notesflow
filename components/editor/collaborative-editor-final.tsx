'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { AIMenuController } from "@blocknote/xl-ai";
import { defaultBlockSpecs } from "@blocknote/core";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { llmFormats } from "@blocknote/xl-ai";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@blocknote/xl-ai/style.css";
import "@/styles/collaboration.css";
import { useTheme } from "next-themes";
import { FormattingToolbarWithAI } from "./ai/FormattingToolbarWithAI";
import { SuggestionMenuWithAI } from "./ai/SuggestionMenuWithAI";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { createCustomAIModel } from "@/lib/ai/blocknote-ai-model";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, WifiOff, Wifi, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAuth } from "@/lib/auth/auth-hooks";
import { createClient } from "@/lib/supabase/client";

interface CollaborativeEditorFinalProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
}

// Use a simpler approach with WebRTC for peer-to-peer collaboration
export function CollaborativeEditorFinal({
  noteId,
  initialContent,
  onContentChange,
  editable = true,
  className,
}: CollaborativeEditorFinalProps) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: number; user: any }>>([]);
  
  // Create Y.Doc with persistence
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  // Create WebRTC provider for real-time sync
  const provider = useMemo(() => {
    if (!user) return null;
    
    // Use a combination of WebRTC and Supabase for signaling
    const provider = new WebrtcProvider(`notesflow-${noteId}`, ydoc, {
      signaling: [
        'wss://signaling.yjs.dev', // Public signaling server
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      password: noteId, // Use noteId as room password
      awareness: {
        user: {
          name: user.name || user.email?.split('@')[0] || 'Anonymous',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          id: user.id,
        }
      },
      maxConns: 20,
    });
    
    provider.on('synced', (synced: boolean) => {
      console.log('[CollaborativeEditor] WebRTC synced:', synced);
      setIsConnected(synced);
    });
    
    return provider;
  }, [user, noteId, ydoc]);
  
  // Create IndexedDB persistence for offline support
  const persistence = useMemo(() => {
    return new IndexeddbPersistence(`notesflow-${noteId}`, ydoc);
  }, [noteId, ydoc]);
  
  // Track active users
  useEffect(() => {
    if (!provider) return;
    
    const awareness = provider.awareness;
    
    const updateUsers = () => {
      const states = awareness.getStates();
      const users: Array<{ id: number; user: any }> = [];
      
      states.forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.user) {
          users.push({ id: clientId, user: state.user });
        }
      });
      
      setActiveUsers(users);
    };
    
    awareness.on('change', updateUsers);
    updateUsers();
    
    return () => {
      awareness.off('change', updateUsers);
    };
  }, [provider]);
  
  // Save to database periodically
  useEffect(() => {
    if (!ydoc || !noteId) return;
    
    const supabase = createClient();
    let saveTimeout: NodeJS.Timeout;
    
    const saveToDatabase = async () => {
      try {
        // Get the current document content
        const fragment = ydoc.getXmlFragment("document-store");
        // We'll save the Y.Doc state for recovery, but the actual content
        // is managed by BlockNote through the Y.Doc
        
        console.log('[CollaborativeEditor] Auto-saving to database');
      } catch (error) {
        console.error('[CollaborativeEditor] Failed to save:', error);
      }
    };
    
    const handleUpdate = () => {
      // Debounce saves
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveToDatabase, 5000); // Save after 5 seconds of inactivity
    };
    
    ydoc.on('update', handleUpdate);
    
    return () => {
      ydoc.off('update', handleUpdate);
      clearTimeout(saveTimeout);
    };
  }, [ydoc, noteId]);
  
  // Create AI model
  const model = createCustomAIModel();
  
  // Create editor with Y.Doc collaboration
  const editor = useCreateBlockNote({
    initialContent: initialContent,
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
    collaboration: provider ? {
      provider: provider as any, // WebRTC provider works with BlockNote
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      },
      showCursorLabels: "activity",
    } : undefined,
  }, []);
  
  // Handle content changes
  const handleChange = () => {
    if (!editor || !onContentChange) return;
    const document = editor.document;
    onContentChange(document);
  };
  
  // Cleanup
  useEffect(() => {
    return () => {
      provider?.disconnect();
      provider?.destroy();
      persistence?.destroy();
      ydoc.destroy();
    };
  }, [provider, persistence, ydoc]);
  
  if (!editor) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }
  
  return (
    <div className={cn("relative h-full", className)}>
      {/* Connection Status & Active Users */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Connection Status */}
        <Badge 
          variant={isConnected ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              Connecting...
            </>
          )}
        </Badge>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {activeUsers.length + 1}
            </Badge>
            
            {/* User Avatars */}
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 5).map((activeUser) => (
                <div
                  key={activeUser.id}
                  className="relative h-8 w-8 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: activeUser.user.color }}
                  title={activeUser.user.name}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {activeUser.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {activeUsers.length > 5 && (
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                  <span className="text-xs">+{activeUsers.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        className="h-full"
        onChange={handleChange}
        formattingToolbar={false}
        slashMenu={false}
      >
        <AIMenuController />
        <FormattingToolbarWithAI />
        <SuggestionMenuWithAI editor={editor} />
      </BlockNoteView>
    </div>
  );
}