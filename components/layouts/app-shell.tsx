'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layouts/sidebar';
import { cn } from '@/lib/utils';
import { AppShellSkeleton } from '@/components/skeletons';
import { useResponsive } from '@/hooks/useResponsive';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeBlockingCalendar } from '@/components/calendar/time-blocking-calendar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop } = useResponsive();

  useEffect(() => {
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-hidden');
    if (savedState !== null) {
      setSidebarHidden(JSON.parse(savedState));
    }
    setIsLoading(false);
  }, []);

  // Listen for calendar toggle keyboard shortcut
  useEffect(() => {
    const handleToggleCalendar = () => setCalendarOpen(prev => !prev);
    window.addEventListener('toggle-calendar', handleToggleCalendar);
    return () => window.removeEventListener('toggle-calendar', handleToggleCalendar);
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarHidden;
    setSidebarHidden(newState);
    localStorage.setItem('sidebar-hidden', JSON.stringify(newState));
  };

  if (isLoading) {
    return <AppShellSkeleton sidebarCollapsed={false} />;
  }

  // Mobile layout with sheet
  if (!isDesktop) {
    return (
      <div className="app-shell min-h-screen bg-background">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="ml-2 flex items-baseline gap-1">
                <span className="text-lg font-bold tracking-tight">NotesFlow</span>
                <span className="text-xs text-muted-foreground">v0.1</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarOpen(!calendarOpen)}
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Mobile sidebar sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar onToggle={() => setMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
        
        {/* Main content */}
        <main className="main-content">
          <div className="h-full w-full">{children}</div>
        </main>
        
        {/* Calendar sidebar */}
        <TimeBlockingCalendar isOpen={calendarOpen} onToggle={() => setCalendarOpen(!calendarOpen)} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="app-shell min-h-screen bg-background">
      {/* Desktop header with hamburger when sidebar is hidden */}
      {sidebarHidden && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold tracking-tight">NotesFlow</span>
              <span className="text-xs text-muted-foreground">v0.1</span>
            </div>
          </div>
        </header>
      )}
      
      <div
        className={cn(
          'grid',
          sidebarHidden ? 'grid-cols-1 h-[calc(100vh-3.5rem)]' : 'grid-cols-[280px_1fr] h-screen'
        )}
      >
        {/* Sidebar for desktop */}
        {!sidebarHidden && (
          <Sidebar onToggle={toggleSidebar} />
        )}
        
        <main className="main-content overflow-hidden relative">
          <div className="h-full w-full">{children}</div>
          
          {/* Bottom right controls */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="shadow-lg"
            >
              <Calendar className="h-5 w-5" />
            </Button>
          </div>
        </main>
      </div>
      
      {/* Calendar sidebar */}
      <TimeBlockingCalendar isOpen={calendarOpen} onToggle={() => setCalendarOpen(!calendarOpen)} />
    </div>
  );
}