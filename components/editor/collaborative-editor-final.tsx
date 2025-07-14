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
import { uploadFile } from "@/lib/editor/upload-handler";
import { preprocessPastedHTML, enhanceBlocksFormatting } from "@/lib/editor/paste-utils";
import { codeBlock } from "@blocknote/code-block";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  isShared?: boolean; // Simple flag indicating if note has collaborators
  enableDragToCalendar?: boolean;
  onTextDragStart?: (text: string) => void;
}

export function CollaborativeEditorFinal({
  noteId,
  initialContent,
  onContentChange,
  editable = true,
  className,
  isShared = false,
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
  const { hasAIAccess, isLoading: isAIAccessLoading } = useAIAccess();
  
  // Create Y.Doc - stable reference
  const ydoc = useMemo(() => new Y.Doc(), [noteId]); // Only recreate if note changes
  
  // Generate consistent user color
  const userColor = useMemo(() => {
    if (!user?.id) return '#' + Math.floor(Math.random()*16777215).toString(16);
    let hash = 0;
    for (let i = 0; i < user.id.length; i++) {
      hash = user.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return '#' + ((hash & 0x00FFFFFF).toString(16).padStart(6, '0'));
  }, [user?.id]);
  
  // Create WebSocket provider only for shared notes
  const provider = useMemo(() => {
    if (!isShared || !user) return null;
    
    const wsUrl = process.env['NEXT_PUBLIC_YJS_SERVER_URL'] || 'ws://localhost:1234';
    
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `notesflow-${noteId}`,
      ydoc,
      {
        maxBackoffTime: 30000,
        WebSocketPolyfill: typeof window !== 'undefined' ? WebSocket : undefined,
      }
    );
    
    // Ensure proper cleanup on unmount
    return wsProvider;
  }, [isShared, user, noteId, ydoc]);
  
  // Get connection status from provider
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    activeUsers: 0
  });
  
  useEffect(() => {
    if (!provider) {
      setConnectionStatus({
        isConnected: false,
        isConnecting: false,
        activeUsers: 0
      });
      return;
    }
    
    const updateStatus = () => {
      const states = provider.awareness.getStates();
      let activeCount = 0;
      
      // Count only users with valid user data
      states.forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID && state?.user) {
          activeCount++;
        }
      });
      
      setConnectionStatus({
        isConnected: provider.wsconnected,
        isConnecting: provider.wsconnecting,
        activeUsers: activeCount
      });
    };
    
    // Update on status changes
    const handleStatus = (event: any) => {
      updateStatus();
    };
    
    // Update on awareness changes with debouncing
    let awarenessTimeout: NodeJS.Timeout;
    const handleAwareness = () => {
      clearTimeout(awarenessTimeout);
      awarenessTimeout = setTimeout(updateStatus, 100);
    };
    
    provider.on('status', handleStatus);
    provider.on('sync', updateStatus);
    provider.awareness.on('change', handleAwareness);
    
    // Initial update after a small delay to ensure provider is ready
    setTimeout(updateStatus, 100);
    
    return () => {
      clearTimeout(awarenessTimeout);
      provider.off('status', handleStatus);
      provider.off('sync', updateStatus);
      provider.awareness.off('change', handleAwareness);
    };
  }, [provider]);
  
  // Create IndexedDB persistence
  const persistence = useMemo(() => {
    return new IndexeddbPersistence(`notesflow-${noteId}`, ydoc);
  }, [noteId]); // Remove ydoc dependency
  
  // Set awareness state when provider is connected
  useEffect(() => {
    if (!provider || !user) return;
    
    const setUserInfo = () => {
      const userInfo = {
        name: user.name || user.email?.split('@')[0] || 'Anonymous',
        color: userColor,
        id: user.id,
      };
      
      // Clear any existing state first
      provider.awareness.setLocalState(null);
      
      // Then set new state
      provider.awareness.setLocalState({
        user: userInfo,
        cursor: null
      });
    };
    
    // Set on connection
    const handleStatus = (event: any) => {
      if (event.status === 'connected') {
        // Delay to ensure connection is stable
        setTimeout(setUserInfo, 100);
      }
    };
    
    provider.on('status', handleStatus);
    
    // Set immediately if already connected
    if (provider.wsconnected) {
      setTimeout(setUserInfo, 100);
    }
    
    return () => {
      provider.off('status', handleStatus);
      // Clear awareness state on cleanup
      if (provider.awareness) {
        provider.awareness.setLocalState(null);
      }
    };
  }, [provider, user, userColor]);
  
  // Create AI model
  const model = useMemo(() => createCustomAIModel(), []);
  
  // Create upload handler with authentication check
  const authenticatedUploadFile = useCallback(async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }
    return uploadFile(file);
  }, [user]);
  
  // Debug logging for AI access
  useEffect(() => {
    // [REMOVED_CONSOLE]
  }, [hasAIAccess, isAIAccessLoading, user]);

  // Create editor with collaboration when provider is available
  const editor = useCreateBlockNote({
    initialContent: provider ? undefined : safeInitialContent,
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
    codeBlock: {
      ...codeBlock,
      defaultLanguage: "javascript",
      indentLineWithTab: true,
    },
    uploadFile: authenticatedUploadFile, // Enable image uploads with auth check
    pasteHandler: async ({ event, editor, defaultPasteHandler }) => {
      // Check if clipboard contains HTML
      const html = event.clipboardData?.getData('text/html');
      
      if (html) {
        try {
          // First preprocess the HTML to handle separators
          const processedHTML = preprocessPastedHTML(html);
          
          // Parse HTML into BlockNote blocks
          const blocks = await editor.tryParseHTMLToBlocks(processedHTML);
          
          // Enhance blocks with proper formatting
          const processedBlocks = enhanceBlocksFormatting(blocks);
          
          // Get current block position
          const currentBlock = editor.getTextCursorPosition().block;
          
          // Insert the parsed blocks
          editor.insertBlocks(processedBlocks, currentBlock, "after");
          
          // Remove the current block if it's empty
          if (!currentBlock.content || currentBlock.content.length === 0) {
            editor.removeBlocks([currentBlock]);
          }
          
          return true;
        } catch (error) {
          console.error('Error parsing pasted HTML:', error);
          // Fall back to default handler on error
          return defaultPasteHandler();
        }
      }
      
      // Fall back to default paste handler for non-HTML content
      return defaultPasteHandler();
    },
    collaboration: provider ? {
      provider,
      fragment: ydoc.getXmlFragment("document-store"),
      user: {
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
        color: userColor,
      },
      showCursorLabels: "activity",
    } : undefined,
  }, [provider, hasAIAccess]); // Recreate when provider or AI access changes

  // Handle text selection for drag to calendar
  const { selection } = useBlockNoteSelection({
    editor,
    enabled: enableDragToCalendar && editable,
  });

  const handleDragStart = useCallback((event: React.DragEvent, text: string) => {
    onTextDragStart?.(text);
  }, [onTextDragStart]);
  
  // Initialize content for non-collaborative mode
  useEffect(() => {
    if (provider || !editor || !safeInitialContent) return;
    
    // For non-collaborative mode, set content directly
    if (editor.document.length === 0) {
      editor.replaceBlocks(editor.document, safeInitialContent);
    }
  }, [provider, editor, safeInitialContent]);
  
  // Initialize content for the first collaborator
  useEffect(() => {
    if (!provider || !editor || !safeInitialContent) return;
    
    // Small delay to let provider connect
    const timeout = setTimeout(() => {
      // Check if document is empty (first collaborator)
      if (editor.document.length === 0 || 
          (editor.document.length === 1 && !editor.document[0].content?.length)) {
        editor.replaceBlocks(editor.document, safeInitialContent);
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [provider, editor, safeInitialContent]);
  
  
  // Handle content changes
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      if (onContentChange && editor.document) {
        onContentChange(editor.document);
      }
    });
    
    return unsubscribe;
  }, [editor, onContentChange]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up in proper order
      if (provider) {
        provider.awareness.setLocalState(null);
        provider.disconnect();
        provider.destroy();
      }
      persistence?.destroy();
      ydoc.destroy();
    };
  }, []);
  
  // Don't render editor until we know the AI access status
  if (!editor || isAIAccessLoading) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }
  
  return (
    <div className={cn(
      "relative h-full",
      className
    )}>
      {/* Simple collaboration indicator */}
      {isShared && (
        <div className="absolute top-4 right-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={connectionStatus.isConnected ? "default" : "secondary"}
                  className="flex items-center gap-1 cursor-help"
                >
                  {connectionStatus.isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      <span>Live</span>
                      {connectionStatus.activeUsers > 0 && (
                        <>
                          <span className="text-xs">•</span>
                          <Users className="h-3 w-3" />
                          <span>{connectionStatus.activeUsers + 1}</span>
                        </>
                      )}
                    </>
                  ) : connectionStatus.isConnecting ? (
                    <>
                      <WifiOff className="h-3 w-3 animate-pulse" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      <span>Offline</span>
                    </>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {connectionStatus.isConnected 
                    ? "Real-time collaboration active" 
                    : connectionStatus.isConnecting 
                    ? "Establishing connection to collaboration server"
                    : "No connection to server"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectionStatus.isConnected 
                    ? `Changes sync instantly with ${connectionStatus.activeUsers > 0 ? connectionStatus.activeUsers + ' other user(s)' : 'the server'}`
                    : connectionStatus.isConnecting 
                    ? "Please wait..."
                    : "Changes saved locally and will sync when reconnected"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      {!isShared && (
        <div className="absolute top-4 right-4 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-help">
                  Private Note
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">This note is private</p>
                <p className="text-xs text-muted-foreground">Only you can see and edit this note</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

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