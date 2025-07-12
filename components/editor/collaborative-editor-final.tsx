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
import { motion, AnimatePresence } from "framer-motion";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { useAuth } from "@/lib/auth/auth-hooks";
import { useAIAccess } from "@/hooks/useAIAccess";
import { useBlockNoteSelection } from "@/hooks/useBlockNoteSelection";
import { SelectionDragHandler } from "./selection-drag-handler";
import { useWebSocketProvider } from "@/hooks/useWebSocketProvider";

interface CollaborativeEditorFinalProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
  forceCollaboration?: boolean;
  enableDragToCalendar?: boolean;
  onTextDragStart?: (text: string) => void;
  onCollaborationStatusChange?: (status: {
    provider: WebsocketProvider | null;
    isConnected: boolean;
    isConnecting: boolean;
    activeUsersCount: number;
  }) => void;
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
  onCollaborationStatusChange,
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
  
  // Use the smart WebSocket provider hook
  const wsUrl = process.env['NEXT_PUBLIC_YJS_SERVER_URL'] || 'ws://localhost:1234';
  const {
    provider,
    isConnected,
    isConnecting,
    retryCount,
    reconnect,
    disconnect
  } = useWebSocketProvider({
    url: wsUrl,
    roomName: `notesflow-${noteId}`,
    doc: ydoc,
    enabled: shouldUseCollaboration && !!user,
    onConnect: () => {
      console.log('[CollaborativeEditor] Connected to WebSocket');
    },
    onDisconnect: () => {
      console.log('[CollaborativeEditor] Disconnected from WebSocket');
    },
    onError: (error) => {
      console.error('[CollaborativeEditor] WebSocket error:', error);
    }
  });
  
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

  // Track active users with optimized updates
  useEffect(() => {
    if (!provider) return;
    
    let updateTimeout: NodeJS.Timeout;
    const pendingUpdates = new Set<number>();
    
    const processUpdates = () => {
      const states = provider.awareness.getStates();
      const users: Array<{ id: number; user: any }> = [];
      const now = Date.now();
      
      states.forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID && state?.user) {
          // Only include users who have been active in the last 30 seconds
          const lastUpdate = state.lastUpdate || now;
          if (now - lastUpdate < 30000) {
            users.push({ id: clientId, user: state.user });
          }
        }
      });
      
      setActiveUsers(users);
      
      // Enable collaboration if there are other users or if forced
      const hasOtherUsers = users.length > 0;
      setShouldUseCollaboration(forceCollaboration || hasOtherUsers);
      
      pendingUpdates.clear();
    };
    
    // Debounced update function
    const scheduleUpdate = (clientId?: number) => {
      if (clientId) pendingUpdates.add(clientId);
      
      if (updateTimeout) clearTimeout(updateTimeout);
      
      // Batch updates within 100ms
      updateTimeout = setTimeout(() => {
        requestIdleCallback(() => processUpdates(), { timeout: 1000 });
      }, 100);
    };
    
    // Update users on awareness changes
    const handleAwarenessChange = ({ added, updated, removed }: any) => {
      [...added, ...updated, ...removed].forEach((clientId: number) => {
        scheduleUpdate(clientId);
      });
    };
    
    provider.awareness.on('change', handleAwarenessChange);
    
    // Initial update
    processUpdates();
    
    // Clean up stale users every 30 seconds
    const cleanupInterval = setInterval(() => {
      processUpdates();
    }, 30000);
    
    return () => {
      provider.awareness.off('change', handleAwarenessChange);
      if (updateTimeout) clearTimeout(updateTimeout);
      clearInterval(cleanupInterval);
    };
  }, [provider, forceCollaboration]);
  
  // Report collaboration status changes
  useEffect(() => {
    onCollaborationStatusChange?.({
      provider,
      isConnected,
      isConnecting,
      activeUsersCount: activeUsers.length
    });
  }, [provider, isConnected, isConnecting, activeUsers.length, onCollaborationStatusChange]);
  
  // Create AI model
  const model = useMemo(() => createCustomAIModel(), []);
  
  // Track if we have a stable provider connection
  const [hasStableProvider, setHasStableProvider] = useState(false);
  
  useEffect(() => {
    // Only mark provider as stable after initial connection
    if (provider && isConnected) {
      setHasStableProvider(true);
    }
  }, [provider, isConnected]);
  
  // Create editor with collaboration when provider is available
  const editor = useCreateBlockNote({
    initialContent: hasStableProvider ? undefined : safeInitialContent,
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
    collaboration: hasStableProvider && provider ? {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: userColor,
      },
      showCursorLabels: "activity",
    } : undefined,
  }, [hasStableProvider]); // Only recreate when provider stability changes

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
  
  // Get border color based on collaboration status
  const getBorderColor = () => {
    if (!provider) return '';
    if (isConnected) return 'ring-2 ring-green-500/30';
    if (isConnecting) return 'ring-2 ring-yellow-500/30 animate-pulse';
    return 'ring-2 ring-red-500/30';
  };
  
  return (
    <div className={cn(
      "relative h-full transition-all duration-300",
      provider && getBorderColor(),
      className
    )}>
      {/* Show collaboration UI only when provider exists */}
      <AnimatePresence>
        {provider && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-10 flex items-center gap-2"
          >
            {/* Connection Status */}
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="flex items-center gap-1 transition-all duration-200"
            >
              <AnimatePresence mode="wait">
                {isConnected ? (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <Wifi className="h-3 w-3" />
                    Connected
                  </motion.div>
                ) : isConnecting ? (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <WifiOff className="h-3 w-3 animate-pulse" />
                    Connecting...
                  </motion.div>
                ) : (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1"
                  >
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </motion.div>
                )}
              </AnimatePresence>
            </Badge>
            
            {/* Manual reconnect button when not connected and not connecting */}
            <AnimatePresence>
              {!isConnected && !isConnecting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reconnect}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reconnect
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {activeUsers.length + 1}
              </Badge>
              
              {/* User Avatars */}
              <div className="flex -space-x-2">
                <AnimatePresence mode="popLayout">
                  {activeUsers.slice(0, 5).map((activeUser) => (
                    <motion.div
                      key={activeUser.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="relative h-8 w-8 rounded-full ring-2 ring-background"
                      style={{ backgroundColor: activeUser.user.color }}
                      title={activeUser.user.name}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {activeUser.user.name.charAt(0).toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                  {activeUsers.length > 5 && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background"
                    >
                      <span className="text-xs">+{activeUsers.length - 5}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      <BlockNoteView
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