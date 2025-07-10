'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const adminNavItems = [
  {
    title: 'Overview',
    href: '/dashboard/admin',
    icon: Home,
  },
  {
    title: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
  },
  {
    title: 'Content',
    href: '/dashboard/admin/content',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/dashboard/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {!collapsed && (
            <span className="font-semibold">Admin Panel</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer - Return to Main App */}
      <div className="border-t p-3">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3',
              collapsed && 'justify-center px-2'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {!collapsed && <span>Back to App</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
}