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
  // Ensure we have valid initial content with proper BlockNote structure
  const safeInitialContent = useMemo(() => {
    if (!initialContent || !Array.isArray(initialContent) || initialContent.length === 0) {
      return [{
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left"
        },
        content: [],
        children: []
      }];
    }
    
    // Validate and clean each block to match BlockNote structure
    const validatedContent = initialContent.map((block: any) => {
      // Ensure block has required structure
      if (!block || typeof block !== 'object') {
        return {
          type: "paragraph",
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left"
          },
          content: [],
          children: []
        };
      }
      
      // Ensure block has a valid type
      const validTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 
                         'checkListItem', 'table', 'image', 'quote'];
      const blockType = block.type && typeof block.type === 'string' && validTypes.includes(block.type) 
                       ? block.type : 'paragraph';
      
      // Ensure props exist with default values
      const props = {
        textColor: "default",
        backgroundColor: "default",
        textAlignment: "left",
        ...(block.props || {})
      };
      
      // Handle content based on block type
      let content: any = [];
      
      // Text-based blocks
      if (['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem', 'quote'].includes(blockType)) {
        if (typeof block.content === 'string') {
          // Convert string to inline content format
          content = block.content ? [{
            type: "text",
            text: block.content,
            styles: {}
          }] : [];
        } else if (Array.isArray(block.content)) {
          // Validate inline content array
          content = block.content.map((inline: any) => {
            if (typeof inline === 'string') {
              return {
                type: "text",
                text: inline,
                styles: {}
              };
            } else if (inline && typeof inline === 'object' && inline.type === 'text') {
              return {
                type: "text",
                text: inline.text || "",
                styles: inline.styles || {}
              };
            }
            return {
              type: "text",
              text: "",
              styles: {}
            };
          });
        } else {
          content = [];
        }
      } else if (blockType === 'table' && block.content) {
        // Handle table content
        content = block.content;
      } else if (blockType === 'image') {
        // Images don't have content
        content = undefined;
      }
      
      // Ensure children is an array
      const children = Array.isArray(block.children) ? block.children : [];
      
      // Return validated block
      return {
        ...(block.id ? { id: block.id } : {}), // Only include id if it exists
        type: blockType,
        props,
        content,
        children
      };
    });
    
    // Ensure we have at least one valid block
    if (validatedContent.length === 0) {
      return [{
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left"
        },
        content: [],
        children: []
      }];
    }
    
    return validatedContent;
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
  
  // Create IndexedDB persistence only for shared notes
  const persistence = useMemo(() => {
    if (!isShared) return null;
    return new IndexeddbPersistence(`notesflow-${noteId}`, ydoc);
  }, [noteId, isShared, ydoc]);
  
  // Clean up IndexedDB when note becomes non-shared
  useEffect(() => {
    if (!isShared && typeof window !== 'undefined') {
      // Clear any stale IndexedDB data for non-shared notes
      const dbName = `y-indexeddb-notesflow-${noteId}`;
      const deleteRequest = window.indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        // Database deleted successfully
      };
      
      deleteRequest.onerror = () => {
        // Ignore errors - database might not exist
      };
    }
  }, [isShared, noteId]);
  
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
    // Only provide initial content for non-collaborative mode
    // For collaborative mode, content comes from Y.js provider
    initialContent: isShared ? undefined : safeInitialContent,
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
          color: resolvedTheme === 'dark' ? "#60d5ff" : "#8bc6ff"
        }
      })
    ],
    blockSpecs: {
      ...defaultBlockSpecs,
    },
    codeBlock: {
      ...codeBlock,
      defaultLanguage: "javascript",
      indentLineWithTab: true,
    },
    tables: {
      splitCells: true,
      cellBackgroundColor: true,
      cellTextColor: true,
      headers: true,
    },
    uploadFile: authenticatedUploadFile, // Enable image uploads with auth check
    pasteHandler: async ({ event, editor, defaultPasteHandler }) => {
      // Check if we're inside a table cell
      const currentBlock = editor.getTextCursorPosition().block;
      
      // Check if current block or any parent is a table
      let isInTable = false;
      let checkBlock = currentBlock;
      while (checkBlock) {
        if (checkBlock.type === 'table') {
          isInTable = true;
          break;
        }
        // Check parent blocks (for nested structures)
        const parentId = (checkBlock as any).parentId;
        if (!parentId) break;
        checkBlock = editor.getBlock(parentId);
      }
      
      // If we're in a table, use default paste behavior
      if (isInTable) {
        return defaultPasteHandler();
      }
      
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
  }, [hasAIAccess, resolvedTheme, isShared]); // Recreate when AI access, theme, or sharing status changes

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
    if (!editor || !safeInitialContent || provider || isShared) return;
    
    // For non-collaborative mode, content is already set via initialContent
    // This effect ensures content is set if editor was created without it
    if (editor.document && editor.document.length === 0) {
      editor.replaceBlocks(editor.document, safeInitialContent);
    }
  }, [provider, editor, safeInitialContent, isShared]);
  
  // Initialize Y.js document with initial content when collaboration starts
  useEffect(() => {
    if (!provider || !editor || !safeInitialContent || !isShared) return;
    
    let mounted = true;
    
    // Check if this is the first time Y.js is being initialized
    const initializeYDoc = async () => {
      // Wait for provider to connect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!mounted) return;
      
      // Wait for persistence to be ready if it exists
      if (persistence) {
        try {
          await persistence.whenSynced;
        } catch (error) {
          // If persistence fails, continue anyway
          console.warn('Persistence sync failed, continuing without it');
        }
      }
      
      if (!mounted) return;
      
      // Get the Y.js fragment
      const fragment = ydoc.getXmlFragment("document-store");
      
      // Check if we need to initialize content
      // Initialize if: fragment is empty AND we have initial content
      if (fragment.length === 0 && safeInitialContent.length > 0 && editor.document) {
        // This is the first time sharing - initialize with content
        // Use a transaction to ensure atomic update
        ydoc.transact(() => {
          editor.replaceBlocks(editor.document, safeInitialContent);
        }, 'initial-content');
      } else if (fragment.length > 0 && editor.document && editor.document.length === 0) {
        // Fragment has content but editor is empty - Y.js will sync automatically
        // Just wait for sync to happen
      }
    };
    
    initializeYDoc();
    
    return () => {
      mounted = false;
    };
  }, [provider, editor, safeInitialContent, isShared, ydoc, persistence]);
  
  
  
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
        <AIMenuController aiMenu={CustomAIMenu} />
        <FormattingToolbarWithAI editor={editor} />
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