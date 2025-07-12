'use client';

import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { CustomAIMenu } from "./ai/CustomAIMenu";
import { createAIExtension } from "@/lib/editor/ai-extension";
import { createCustomAIModel } from "@/lib/ai/blocknote-ai-model";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, WifiOff, Wifi, RefreshCw } from "lucide-react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAuth } from "@/lib/auth/auth-hooks";
import { useAIAccess } from "@/hooks/useAIAccess";
import { useBlockNoteSelection } from "@/hooks/useBlockNoteSelection";
import { SelectionDragHandler } from "./selection-drag-handler";

interface CollaborativeEditorFinalProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
  forceCollaboration?: boolean;
  enableDragToCalendar?: boolean;
  onTextDragStart?: (text: string) => void;
}

export function CollaborativeEditorFinal({
  noteId,
  initialContent,
  onContentChange,
  editable = true,
  className,
  forceCollaboration = false,
  enableDragToCalendar = false,
  onTextDragStart,
}: CollaborativeEditorFinalProps) {
  // Ensure we have valid initial content
  const safeInitialContent = useMemo(() => {
    if (!initialContent || !Array.isArray(initialContent) || initialContent.length === 0) {
      return [{ type: "paragraph", content: "" }];
    }
    return initialContent;
  }, [initialContent]);
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const { hasAIAccess } = useAIAccess();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: number; user: any }>>([]);
  const [shouldUseCollaboration, setShouldUseCollaboration] = useState(forceCollaboration);
  
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
  
  // Create WebSocket provider (optional - only for collaboration)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryDelay = useCallback((attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000), []);
  
  // Function to create WebSocket provider
  const createProvider = useCallback(() => {
    if (!user || !shouldUseCollaboration) return null;
    
    try {
      const wsUrl = process.env['NEXT_PUBLIC_YJS_SERVER_URL'] || 'ws://localhost:1234';
      console.log('[CollaborativeEditor] Creating WebSocket provider:', wsUrl);
      
      const wsProvider = new WebsocketProvider(
        wsUrl,
        `notesflow-${noteId}`,
        ydoc,
        {
          WebSocketPolyfill: WebSocket,
          resyncInterval: 5000,
          connect: true,
          params: {},
          protocols: [],
        }
      );
      
      // Monitor connection status
      wsProvider.on('status', (event: any) => {
        console.log('[CollaborativeEditor] WebSocket status:', event.status);
        setIsConnected(event.status === 'connected');
        
        if (event.status === 'connected') {
          // Reset retry count on successful connection
          setRetryCount(0);
        }
      });
      
      wsProvider.on('sync', (isSynced: boolean) => {
        console.log('[CollaborativeEditor] Sync status:', isSynced);
      });
      
      wsProvider.on('connection-error', (error: any) => {
        console.warn('[CollaborativeEditor] Connection error:', error);
      });
      
      wsProvider.on('close', () => {
        console.log('[CollaborativeEditor] WebSocket closed');
        setIsConnected(false);
        
        // Attempt reconnection with exponential backoff
        if (retryCount < maxRetries && shouldUseCollaboration) {
          const delay = retryDelay(retryCount);
          console.log(`[CollaborativeEditor] Retrying connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setProvider(null); // Clear old provider
          }, delay);
        }
      });
      
      return wsProvider;
    } catch (error) {
      console.warn('[CollaborativeEditor] Failed to create WebSocket provider:', error);
      return null;
    }
  }, [user, noteId, ydoc, shouldUseCollaboration, retryCount, retryDelay, maxRetries]);
  
  // Create/recreate provider when needed
  useEffect(() => {
    let mounted = true;
    
    if (!provider && shouldUseCollaboration && user) {
      const newProvider = createProvider();
      if (newProvider && mounted) {
        setProvider(newProvider);
      }
    } else if (provider && !shouldUseCollaboration) {
      // Clean up provider when collaboration is disabled
      provider.awareness.setLocalState(null);
      provider.disconnect();
      provider.destroy();
      setProvider(null);
    }
    
    return () => {
      mounted = false;
      if (provider) {
        provider.awareness.setLocalState(null);
        provider.disconnect();
        provider.destroy();
      }
    };
  }, [provider, shouldUseCollaboration, user, createProvider]);
  
  // Create IndexedDB persistence
  const persistence = useMemo(() => {
    const indexeddbProvider = new IndexeddbPersistence(`notesflow-${noteId}`, ydoc);
    indexeddbProvider.on('synced', () => {
      console.log('[CollaborativeEditor] IndexedDB synced');
    });
    return indexeddbProvider;
  }, [noteId, ydoc]);
  
  
  // Set awareness state when provider is connected
  useEffect(() => {
    if (!provider || !user) return;
    
    const setUserInfo = () => {
      const userInfo = {
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        color: userColor,
        id: user.id,
      };
      
      // Set the full awareness state, not just a field
      provider.awareness.setLocalState({
        user: userInfo,
        cursor: null // Initialize cursor position
      });
      
      console.log('[CollaborativeEditor] Set awareness state:', {
        clientID: provider.awareness.clientID,
        userInfo
      });
    };
    
    // Set immediately if already connected
    if (isConnected) {
      setUserInfo();
    }
    
    // Also set when connection status changes
    const handleStatus = (event: any) => {
      if (event.status === 'connected') {
        // Delay to ensure WebSocket is fully ready
        setTimeout(setUserInfo, 200);
      }
    };
    
    provider.on('status', handleStatus);
    
    return () => {
      provider.off('status', handleStatus);
    };
  }, [provider, user, userColor, isConnected]);

  // Track active users and determine if collaboration should be active
  useEffect(() => {
    if (!provider) return;
    
    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const users: Array<{ id: number; user: any }> = [];
      
      console.log('[CollaborativeEditor] Awareness update:', {
        totalStates: states.size,
        myClientID: provider.awareness.clientID,
        wsReadyState: (provider as any).ws?.readyState,
        synced: provider.synced
      });
      
      states.forEach((state, clientId) => {
        console.log(`[CollaborativeEditor] Client ${clientId}:`, state);
        if (clientId !== provider.awareness.clientID && state?.user) {
          users.push({ id: clientId, user: state.user });
        }
      });
      
      setActiveUsers(users);
      console.log('[CollaborativeEditor] Active users:', users);
      
      // Enable collaboration if there are other users or if forced
      const hasOtherUsers = users.length > 0;
      setShouldUseCollaboration(forceCollaboration || hasOtherUsers);
    };
    
    // Update users on any awareness change
    provider.awareness.on('change', updateUsers);
    provider.awareness.on('update', updateUsers);
    
    // Force update every 2 seconds to debug
    const debugInterval = setInterval(updateUsers, 2000);
    
    // Initial update
    updateUsers();
    
    return () => {
      provider.awareness.off('change', updateUsers);
      provider.awareness.off('update', updateUsers);
      clearInterval(debugInterval);
    };
  }, [provider, forceCollaboration]);
  
  // Create AI model
  const model = useMemo(() => createCustomAIModel(), []);
  
  // Track if we should use collaboration in editor config
  const [useCollaborativeEditor, setUseCollaborativeEditor] = useState(false);
  
  // Only switch to collaborative editor when provider is actually connected
  useEffect(() => {
    if (provider && isConnected && !useCollaborativeEditor) {
      setUseCollaborativeEditor(true);
    } else if (!provider && useCollaborativeEditor) {
      setUseCollaborativeEditor(false);
    }
  }, [provider, isConnected, useCollaborativeEditor]);
  
  // Create editor with or without collaboration based on state
  const editor = useCreateBlockNote({
    initialContent: useCollaborativeEditor ? undefined : safeInitialContent,
    dictionary: {
      ...en,
      ai: aiEn
    },
    extensions: hasAIAccess ? [
      createAIExtension({
        model,
        stream: true,
        dataFormat: llmFormats.html,
        agentCursor: {
          name: "AI",
          color: "#8bc6ff"
        }
      })
    ] : [],
    blockSpecs: {
      ...defaultBlockSpecs,
    },
    collaboration: useCollaborativeEditor && provider ? {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: userColor,
      },
      showCursorLabels: "activity"
    } : undefined,
  }, [useCollaborativeEditor]); // Only recreate when switching collaboration modes

  // Handle text selection for drag to calendar
  const { selection } = useBlockNoteSelection({
    editor,
    enabled: enableDragToCalendar && editable,
  });

  const handleDragStart = useCallback((event: React.DragEvent, text: string) => {
    console.log('[CollaborativeEditor] Drag started with text:', text);
    onTextDragStart?.(text);
  }, [onTextDragStart]);
  
  // Initialize Y.Doc content when provider and editor are ready
  useEffect(() => {
    if (!provider || !ydoc || !editor) return;
    
    let initialized = false;
    
    const initializeContent = () => {
      if (initialized) return;
      
      const fragment = ydoc.getXmlFragment("document-store");
      
      // If document is empty and we have initial content
      if (fragment.length === 0 && safeInitialContent && safeInitialContent.length > 0) {
        console.log('[CollaborativeEditor] Initializing Y.Doc with content');
        initialized = true;
        
        // Use a transaction to avoid conflicts
        ydoc.transact(() => {
          try {
            // Initialize the editor content
            editor.replaceBlocks(editor.document, safeInitialContent);
          } catch (error) {
            console.error('[CollaborativeEditor] Error setting initial content:', error);
          }
        });
      }
    };
    
    // Try to initialize when provider is synced
    const handleSync = (synced: boolean) => {
      if (synced) {
        setTimeout(initializeContent, 100); // Small delay to ensure everything is ready
      }
    };
    
    provider.on('sync', handleSync);
    
    // Also try if already synced
    if (provider.synced) {
      setTimeout(initializeContent, 100);
    }
    
    return () => {
      provider.off('sync', handleSync);
    };
  }, [provider, ydoc, editor, safeInitialContent]);
  
  // Handle content changes
  useEffect(() => {
    if (!editor) return;
    
    console.log('[CollaborativeEditor] Editor initialized');
    console.log('[CollaborativeEditor] Editor extensions:', editor.extensions);
    console.log('[CollaborativeEditor] Editor _tiptapEditor extensions:', editor._tiptapEditor?.extensions);
    
    const unsubscribe = editor.onChange(() => {
      try {
        if (onContentChange && editor.document) {
          onContentChange(editor.document);
        }
      } catch (error) {
        console.error('[CollaborativeEditor] Error in onChange:', error);
      }
    });
    
    return unsubscribe;
  }, [editor, onContentChange]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      console.log('[CollaborativeEditor] Cleaning up...');
      
      // Cleanup is handled in the provider effect above
      persistence?.destroy();
      ydoc.destroy();
    };
  }, [persistence, ydoc]);
  
  if (!editor) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }
  
  return (
    <div className={cn("relative h-full", className)}>
      {/* Show collaboration UI only when provider exists */}
      {provider && (
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
                {retryCount >= maxRetries ? 'Offline' : 'Connecting...'}
              </>
            )}
          </Badge>
          
          {/* Manual reconnect button when max retries exceeded */}
          {retryCount >= maxRetries && !isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRetryCount(0);
                setProvider(null);
              }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reconnect
            </Button>
          )}

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
      )}

      <BlockNoteView
        key={useCollaborativeEditor ? 'collaborative' : 'standalone'}
        editor={editor}
        editable={editable}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        className="h-full"
        formattingToolbar={false}
        slashMenu={false}
      >
        {hasAIAccess && <AIMenuController aiMenu={CustomAIMenu} />}
        <FormattingToolbarWithAI showAI={hasAIAccess} />
        <SuggestionMenuWithAI editor={editor} />
      </BlockNoteView>
      
      {/* Drag handler for calendar integration */}
      {enableDragToCalendar && (
        <SelectionDragHandler
          selection={selection}
          onDragStart={handleDragStart}
        />
      )}
    </div>
  );
}