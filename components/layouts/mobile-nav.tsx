'use client';

import { Home, Calendar, Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  className?: string;
  onNewNote?: () => void;
}

export function MobileNav({ className, onNewNote }: MobileNavProps) {
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Trash2, label: 'Trash', href: '/trash' },
    { icon: Calendar, label: 'Calendar', href: '/calendar' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <TooltipProvider key={item.label} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {/* Floating action button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={onNewNote}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>New Note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}