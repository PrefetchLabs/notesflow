'use client';

import { useEffect, useState, useMemo } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@/styles/collaboration.css";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuth } from "@/lib/auth/auth-hooks";

interface CollaborativeEditorSimpleProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
}

export function CollaborativeEditorSimple({
  noteId,
  initialContent = [{ type: "paragraph", content: "" }],
  onContentChange,
  editable = true,
  className,
}: CollaborativeEditorSimpleProps) {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // Create Y.Doc
  const ydoc = useMemo(() => new Y.Doc(), []);
  
  // Create WebSocket provider
  const provider = useMemo(() => {
    if (!user) return null;
    
    const wsUrl = process.env['NEXT_PUBLIC_YJS_SERVER_URL'] || 'ws://localhost:1234';
    const wsProvider = new WebsocketProvider(
      wsUrl,
      `notesflow-${noteId}`,
      ydoc
    );
    
    // Generate user color
    const userColor = user.id 
      ? '#' + ((user.id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) & 0x00FFFFFF).toString(16).padStart(6, '0'))
      : '#' + Math.floor(Math.random()*16777215).toString(16);
    
    // Set user info
    wsProvider.awareness.setLocalStateField('user', {
      name: user.email?.split('@')[0] || 'Anonymous',
      color: userColor,
    });
    
    wsProvider.on('status', (event: any) => {
      console.log('[Simple] WebSocket status:', event.status);
      setIsConnected(event.status === 'connected');
    });
    
    return wsProvider;
  }, [user, noteId, ydoc]);
  
  // Create editor
  const editor = useCreateBlockNote(
    provider ? {
      initialContent,
      collaboration: {
        provider,
        fragment: ydoc.getXmlFragment("document-store"),
        user: {
          name: user?.email?.split('@')[0] || 'Anonymous',
          color: provider.awareness.getLocalState()?.['user']?.color || '#000000',
        },
      },
    } : {
      initialContent,
    },
    [provider, ydoc]
  );
  
  // Handle content changes
  useEffect(() => {
    if (!editor) return;
    
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
      provider?.disconnect();
      provider?.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);
  
  if (!editor) {
    return <div className="h-full w-full animate-pulse bg-muted" />;
  }
  
  return (
    <div className={cn("relative h-full", className)}>
      <div className="absolute top-4 right-4 z-10">
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
      </div>

      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        className="h-full"
      />
    </div>
  );
}