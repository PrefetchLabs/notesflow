'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layouts/sidebar';
import { cn } from '@/lib/utils';
import { AppShellSkeleton } from '@/components/skeletons';
import { useResponsive } from '@/hooks/useResponsive';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop } = useResponsive();

  useEffect(() => {
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
    // Auto-collapse sidebar on mobile/tablet
    if (!isDesktop) {
      setSidebarCollapsed(true);
    }
    setIsLoading(false);
  }, [isDesktop]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  if (isLoading) {
    return <AppShellSkeleton sidebarCollapsed={sidebarCollapsed} />;
  }

  // Mobile layout with sheet
  if (!isDesktop) {
    return (
      <div className="app-shell min-h-screen bg-background">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 text-lg font-semibold">NotesFlow</span>
          </div>
        </header>
        
        {/* Mobile sidebar sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        {/* Main content */}
        <main className="main-content">
          <div className="h-full w-full">{children}</div>
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      className={cn(
        'app-shell min-h-screen bg-background',
        'grid transition-all duration-300 ease-in-out',
        sidebarCollapsed
          ? 'grid-cols-[60px_1fr]'
          : 'grid-cols-[280px_1fr]'
      )}
    >
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className="main-content overflow-hidden">
        <div className="h-full w-full">{children}</div>
      </main>
    </div>
  );
}