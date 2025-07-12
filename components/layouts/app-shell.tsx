'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layouts/sidebar';
import { cn } from '@/lib/utils';
import { AppShellSkeleton } from '@/components/skeletons';
import { useResponsive } from '@/hooks/useResponsive';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Menu, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeBlockingCalendar } from '@/components/calendar/time-blocking-calendar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);
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
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
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
                <span className="text-lg font-light tracking-tight">NotesFlow</span>
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
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-light tracking-tight">NotesFlow</span>
                <span className="text-xs text-muted-foreground">v0.1</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}
      
      {/* Theme toggle and Calendar toggle buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <ThemeToggle />
        {!calendarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCalendarOpen(true)}
            title="Show calendar"
            className={cn(
              "h-8 w-8 rounded-full border bg-background shadow-sm",
              "hover:bg-accent hover:shadow-md",
              "transition-all duration-200"
            )}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Calendar hide button - visible when calendar is open */}
      {calendarOpen && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarOpen(false)}
                className={cn(
                  'fixed right-[284px] z-50 h-8 w-8 rounded-full border bg-background shadow-sm',
                  'hover:bg-accent hover:shadow-md',
                  'transition-shadow duration-200',
                  sidebarHidden ? 'top-[88px]' : 'top-4'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Hide calendar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <div
        className={cn(
          'grid',
          sidebarHidden ? 'h-[calc(100vh-3.5rem)]' : 'h-screen',
          // Grid columns
          {
            'grid-cols-1': sidebarHidden && !calendarOpen,
            'grid-cols-[280px_1fr]': !sidebarHidden && !calendarOpen,
            'grid-cols-[1fr_280px]': sidebarHidden && calendarOpen,
            'grid-cols-[280px_1fr_280px]': !sidebarHidden && calendarOpen,
          }
        )}
      >
        {/* Left Sidebar */}
        {!sidebarHidden && (
          <Sidebar onToggle={toggleSidebar} />
        )}
        
        {/* Main Content */}
        <main className="main-content overflow-hidden">
          <div className="h-full w-full">{children}</div>
        </main>
        
        {/* Right Calendar Sidebar */}
        {calendarOpen && (
          <TimeBlockingCalendar isOpen={calendarOpen} onToggle={() => setCalendarOpen(!calendarOpen)} />
        )}
      </div>
    </div>
  );
}