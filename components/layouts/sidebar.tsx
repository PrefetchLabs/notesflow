'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/layouts/user-profile';
import { FolderTree } from '@/components/layouts/folder-tree';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = memo(function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sidebar relative flex h-screen flex-col border-r bg-background transition-all duration-300 ease-out",
        collapsed ? "w-[60px]" : "w-[280px]"
      )}
      style={{
        // Add will-change for performance
        willChange: "width",
      }}
    >
      {/* Collapse/Expand Button */}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className={cn(
                  'absolute -right-4 top-6 z-10 h-8 w-8 rounded-full border bg-background shadow-sm',
                  'hover:bg-accent hover:shadow-md',
                  'transition-shadow duration-200'
                )}
              >
                <motion.div
                  animate={{ rotate: collapsed ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Profile Section */}
      <div className="border-b p-4">
        <UserProfile collapsed={collapsed} />
      </div>

      {/* Folder Tree Section */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <FolderTree collapsed={collapsed} />
        </div>
      </ScrollArea>

      {/* Bottom Section - Settings/Actions */}
      <div className="border-t p-4">
        {/* Settings and other actions can go here */}
      </div>
    </aside>
  );
});