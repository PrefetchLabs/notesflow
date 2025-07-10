'use client';

import { BlockNoteView } from "@blocknote/mantine";
import { AIMenuController } from "@blocknote/xl-ai";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@blocknote/xl-ai/style.css";
import "@/styles/collaboration.css";
import { useTheme } from "next-themes";
import { useCollaborativeBlockNote } from "@/hooks/useCollaborativeBlockNote";
import { FormattingToolbarWithAI } from "./ai/FormattingToolbarWithAI";
import { SuggestionMenuWithAI } from "./ai/SuggestionMenuWithAI";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, WifiOff, Wifi, UserPlus, UserMinus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { testRealtimeConnection } from "@/lib/collaboration/test-realtime";

interface CollaborativeEditorProps {
  noteId: string;
  initialContent?: any[];
  onContentChange?: (content: any[]) => void;
  editable?: boolean;
  className?: string;
}

export function CollaborativeEditor({
  noteId,
  initialContent,
  onContentChange,
  editable = true,
  className,
}: CollaborativeEditorProps) {
  const { resolvedTheme } = useTheme();
  const { editor, isConnected, awareness } = useCollaborativeBlockNote({
    noteId,
    initialContent,
  });
  
  console.log('[CollaborativeEditor] Render - isConnected:', isConnected, 'awareness:', awareness);
  
  const [activeUsers, setActiveUsers] = useState<Array<{ id: number; user: any }>>([]);
  const previousUsersRef = useRef<Array<{ id: number; user: any }>>([]);
  
  // Test realtime connection on mount
  useEffect(() => {
    console.log('[CollaborativeEditor] Testing realtime connection...');
    testRealtimeConnection().then(result => {
      console.log('[CollaborativeEditor] Realtime test result:', result);
    });
  }, []);

  // Track active users and show join/leave notifications
  useEffect(() => {
    if (!awareness) {
      console.log('[CollaborativeEditor] No awareness yet');
      return;
    }

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
          // User joined
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
          // User left
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
    updateUsers(); // Initial update

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  // Handle content changes
  const handleChange = () => {
    if (!editor) return;
    
    const document = editor.document;
    
    if (onContentChange) {
      onContentChange(document);
    }
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
              Offline
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