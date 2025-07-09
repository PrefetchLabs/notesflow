'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Sidebar placeholder */}
      <aside className="w-64 border-r border-border bg-sidebar">
        <div className="p-4">
          <h1 className="text-xl font-semibold">NotesFlow</h1>
        </div>
        
        {/* User profile section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => signOut()}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex">
        {/* Editor area */}
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-light mb-4">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-muted-foreground">Your thoughts and time, beautifully unified.</p>
        </div>

        {/* Calendar sidebar */}
        <aside className="w-80 border-l border-border bg-background p-4">
          <h3 className="text-lg font-medium mb-4">Time Blocks</h3>
          <p className="text-sm text-muted-foreground">Drag text here to create time blocks</p>
        </aside>
      </main>
    </div>
  );
}
