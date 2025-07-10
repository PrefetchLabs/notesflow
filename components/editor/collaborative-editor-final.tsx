'use client';

import { useEffect, useState, useMemo } from "react";
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
import { Users, WifiOff, Wifi } from "lucide-react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAuth } from "@/lib/auth/auth-hooks";

interface CollaborativeEditorFinalProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
}

export function CollaborativeEditorFinal({
  noteId,
  initialContent = [{ type: "paragraph", content: "" }],
  onContentChange,
  editable = true,
  className,
}: CollaborativeEditorFinalProps) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: number; user: any }>>([]);
  
  // Create Y.Doc
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  // Generate consistent user color
  const userColor = useMemo(() => {
    if (!user?.id) return '#' + Math.floor(Math.random()*16777215).toString(16);
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return '#' + ((hash & 0x00FFFFFF).toString(16).padStart(6, '0'));
  }, [user?.id]);
  
  // Create WebSocket provider
  const provider = useMemo(() => {
    if (!user) return null;
    
    const wsUrl = process.env['NEXT_PUBLIC_YJS_SERVER_URL'] || 'ws://localhost:1234';
    console.log('[CollaborativeEditor] Creating WebSocket provider:', wsUrl);
    
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `notesflow-${noteId}`,
      ydoc,
      {
        WebSocketPolyfill: WebSocket,
        resyncInterval: 5000,
      }
    );
    
    // Set user info
    wsProvider.awareness.setLocalStateField('user', {
      name: user.name || user.email?.split('@')[0] || 'Anonymous',
      color: userColor,
      id: user.id,
    });
    
    // Monitor connection status
    wsProvider.on('status', (event: any) => {
      console.log('[CollaborativeEditor] WebSocket status:', event.status);
      setIsConnected(event.status === 'connected');
    });
    
    wsProvider.on('sync', (isSynced: boolean) => {
      console.log('[CollaborativeEditor] Sync status:', isSynced);
    });
    
    return wsProvider;
  }, [user, noteId, ydoc, userColor]);
  
  // Create IndexedDB persistence
  const persistence = useMemo(() => {
    const indexeddbProvider = new IndexeddbPersistence(`notesflow-${noteId}`, ydoc);
    indexeddbProvider.on('synced', () => {
      console.log('[CollaborativeEditor] IndexedDB synced');
    });
    return indexeddbProvider;
  }, [noteId, ydoc]);
  
  // Track active users
  useEffect(() => {
    if (!provider) return;
    
    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const users: Array<{ id: number; user: any }> = [];
      
      states.forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID && state.user) {
          users.push({ id: clientId, user: state.user });
        }
      });
      
      setActiveUsers(users);
      console.log('[CollaborativeEditor] Active users:', users);
    };
    
    provider.awareness.on('change', updateUsers);
    updateUsers();
    
    return () => {
      provider.awareness.off('change', updateUsers);
    };
  }, [provider]);
  
  // Create AI model
  const model = useMemo(() => createCustomAIModel(), []);
  
  // Create editor
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
    collaboration: provider ? {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: userColor,
      },
    } : undefined,
  }, [provider, ydoc, user, userColor]);
  
  // Handle content changes
  useEffect(() => {
    if (!editor) return;
    
    console.log('[CollaborativeEditor] Editor initialized');
    
    const unsubscribe = editor.onChange(() => {
      if (onContentChange) {
        onContentChange(editor.document);
      }
    });
    
    return unsubscribe;
  }, [editor, onContentChange]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      console.log('[CollaborativeEditor] Cleaning up...');
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
      >
        <AIMenuController />
        <FormattingToolbarWithAI editor={editor} />
        <SuggestionMenuWithAI editor={editor} />
      </BlockNoteView>
    </div>
  );
}