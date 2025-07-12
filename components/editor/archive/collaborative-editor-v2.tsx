'use client';

import { useEffect, useState, useRef } from "react";
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
import { SupabaseProvider } from "@/lib/collaboration/supabase-yjs-provider";
import { useAuth } from "@/lib/auth/auth-hooks";

interface CollaborativeEditorV2Props {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
}

export function CollaborativeEditorV2({
  noteId,
  initialContent,
  onContentChange,
  editable = true,
  className,
}: CollaborativeEditorV2Props) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: number; user: any }>>([]);
  
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SupabaseProvider | null>(null);
  const previousUsersRef = useRef<Array<{ id: number; user: any }>>([]);
  
  // Initialize collaboration
  useEffect(() => {
    if (!user || !noteId) {
      // [REMOVED_CONSOLE]
      return;
    }
    
    // [REMOVED_CONSOLE]
    
    // Create Y.Doc
    const doc = new Y.Doc();
    docRef.current = doc;
    
    // Don't initialize content here - let BlockNote handle it
    // The Y.Doc will sync with other users if they already have content
    
    // Create provider
    const provider = new SupabaseProvider(doc, {
      noteId,
      user: {
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      },
    });
    providerRef.current = provider;
    
    // Listen to connection changes
    const unsubscribeConnection = provider.onConnectionChange((connected) => {
      // [REMOVED_CONSOLE]
      setIsConnected(connected);
    });
    
    // Listen to awareness changes
    const awareness = provider.getAwareness();
    const updateUsers = () => {
      const states = awareness.getStates();
      const users: Array<{ id: number; user: any }> = [];
      
      states.forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.user) {
          users.push({ id: clientId, user: state.user });
        }
      });
      
      // Check for new users (joined)
      const previousIds = previousUsersRef.current.map(u => u.id);
      const currentIds = users.map(u => u.id);
      
      users.forEach(user => {
        if (!previousIds.includes(user.id)) {
          toast.success(
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{user.user.name} joined</span>
            </div>,
            { duration: 3000 }
          );
        }
      });
      
      // Check for users who left
      previousUsersRef.current.forEach(user => {
        if (!currentIds.includes(user.id)) {
          toast.info(
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              <span>{user.user.name} left</span>
            </div>,
            { duration: 3000 }
          );
        }
      });
      
      previousUsersRef.current = users;
      setActiveUsers(users);
    };
    
    awareness.on('change', updateUsers);
    updateUsers();
    
    // Mark as ready after a short delay to ensure everything is initialized
    setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    // Cleanup
    return () => {
      // [REMOVED_CONSOLE]
      awareness.off('change', updateUsers);
      unsubscribeConnection();
      provider.disconnect();
      providerRef.current = null;
      docRef.current = null;
      setIsReady(false);
    };
  }, [user, noteId]); // Don't include initialContent to avoid re-creating
  
  // Create AI model
  const model = createCustomAIModel();
  
  // Create editor
  const editor = useCreateBlockNote({
    // Provide initialContent always - BlockNote will handle it correctly
    // In collaborative mode, it will use Y.Doc if it has content
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
    collaboration: isReady && docRef.current && providerRef.current ? {
      provider: providerRef.current as any,
      fragment: docRef.current.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      },
      showCursorLabels: "activity",
    } : undefined,
  }, [noteId, isReady]); // Only recreate when these change
  
  // Handle content changes
  const handleChange = () => {
    if (!editor || !onContentChange) return;
    const document = editor.document;
    onContentChange(document);
  };
  
  if (!editor) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }
  
  return (
    <div className={cn("relative h-full", className)}>
      {/* Connection Status & Active Users */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Connection Status */}
        <Badge 
          variant={isConnected ? "default" : "destructive"}
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