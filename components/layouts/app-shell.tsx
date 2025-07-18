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
import { MobileCalendarSheet } from '@/components/calendar/mobile-calendar-sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { APP_VERSION } from '@/lib/config/version';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isDesktop, isTablet, isMobile } = useResponsive();

  useEffect(() => {
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('sidebar-hidden');
    if (savedState !== null) {
      setSidebarHidden(JSON.parse(savedState));
    }
    // Default to hidden sidebar on tablets
    if (isTablet && savedState === null) {
      setSidebarHidden(true);
    }
    // Default to closed calendar on tablets
    if (isTablet) {
      setCalendarOpen(false);
    }
    setIsLoading(false);
  }, [isTablet]);

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
                <h1 className="text-xl font-bold text-foreground font-notes-flow whitespace-nowrap">NotesFlow</h1>
                <span className="text-sm font-normal text-muted-foreground ml-1 hidden sm:inline">{APP_VERSION}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarOpen(!calendarOpen)}
                title="Toggle calendar"
              >
                <Calendar className="h-5 w-5" />
              </Button>
              <ThemeToggle />
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
        
        {/* Mobile Calendar Sheet */}
        <MobileCalendarSheet 
          isOpen={calendarOpen} 
          onOpenChange={setCalendarOpen} 
        />
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
                <h1 className="text-xl font-bold text-foreground font-notes-flow whitespace-nowrap">NotesFlow</h1>
                <span className="text-sm font-normal text-muted-foreground ml-1 hidden sm:inline">{APP_VERSION}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCalendarOpen(!calendarOpen)}
                title="Toggle calendar"
              >
                <Calendar className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}
      
      
      <div
        className={cn(
          'grid',
          sidebarHidden ? 'h-[calc(100vh-3.5rem)]' : 'h-screen',
          // Grid columns - adjust for tablets
          isTablet ? {
            'grid-cols-1': sidebarHidden || (!sidebarHidden && !calendarOpen),
            'grid-cols-[240px_1fr]': !sidebarHidden && !calendarOpen,
          } : {
            'grid-cols-1': sidebarHidden && !calendarOpen,
            'grid-cols-[280px_1fr]': !sidebarHidden && !calendarOpen,
            'grid-cols-[1fr_280px]': sidebarHidden && calendarOpen,
            'grid-cols-[280px_1fr_280px]': !sidebarHidden && calendarOpen,
          }
        )}
      >
        {/* Left Sidebar */}
        {!sidebarHidden && (
          <div className={isTablet ? "w-[240px]" : ""}>
            <Sidebar onToggle={toggleSidebar} />
          </div>
        )}
        
        {/* Main Content */}
        <main className="main-content overflow-hidden">
          <div className="h-full w-full">{children}</div>
        </main>
        
        {/* Right Calendar - Use Sheet for tablets, sidebar for desktop */}
        {isTablet ? (
          <MobileCalendarSheet 
            isOpen={calendarOpen} 
            onOpenChange={setCalendarOpen} 
          />
        ) : (
          calendarOpen && (
            <TimeBlockingCalendar isOpen={calendarOpen} onToggle={() => setCalendarOpen(!calendarOpen)} />
          )
        )}
      </div>
    </div>
  );
}