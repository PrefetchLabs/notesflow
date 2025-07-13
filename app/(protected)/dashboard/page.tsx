'use client';

import { useState } from 'react';
import { Welcome } from '@/components/empty-states';
import { useAuth } from '@/lib/auth/auth-hooks';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MobileNav } from '@/components/layouts/mobile-nav';
import { useResponsive } from '@/hooks/useResponsive';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { UsageIndicator } from '@/components/upgrade/usage-indicator';
import { UpgradeBanner } from '@/components/upgrade/upgrade-banner';
import { GracePeriodBanner } from '@/components/upgrade/grace-period-banner';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const { isMobile } = useResponsive();
  const { isFreeTier, limits, usage, checkLimit } = useSubscription();

  const handleGetStarted = async () => {
    setHasStarted(true);
    // Create the first note for the user
    try {
      const defaultContent = [
        {
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [{
            type: 'text',
            text: 'Welcome to NotesFlow! Start typing here...'
          }],
          children: [],
        },
      ];
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My First Note',
          content: defaultContent,
        }),
      });
      
      if (response.ok) {
        const { note } = await response.json();
        router.push(`/notes/${note.id}`);
      }
    } catch {
      // [REMOVED_CONSOLE]
    }
  };

  if (!hasStarted) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Welcome 
          userName={user?.name?.split(' ')[0] || undefined} 
          onGetStarted={handleGetStarted}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 md:pb-6">
        <motion.div 
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Grace Period Banner */}
          <GracePeriodBanner />
          
          <p className="text-muted-foreground mt-4">
            Welcome back! Your notes and folders will appear here.
          </p>
          
          <div className="mt-6 rounded-lg border bg-card p-4 sm:mt-8 sm:p-6">
            <h2 className="text-base font-semibold sm:text-lg">Quick Stats</h2>
            <div className="mt-4 grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3">
              <motion.div 
                className="rounded-lg bg-background p-3 sm:p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">Total Notes</p>
                <p className="text-xl font-bold sm:text-2xl">{usage.notesCount}</p>
              </motion.div>
              <motion.div 
                className="rounded-lg bg-background p-3 sm:p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">Folders</p>
                <p className="text-xl font-bold sm:text-2xl">{usage.foldersCount}</p>
              </motion.div>
              <motion.div 
                className="rounded-lg bg-background p-3 sm:p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">Time Blocks Today</p>
                <p className="text-xl font-bold sm:text-2xl">0</p>
              </motion.div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button onClick={() => setHasStarted(false)} variant="outline">
              Show Welcome Screen
            </Button>
          </div>

          {/* Usage Indicators for Free Tier */}
          {isFreeTier && (
            <div className="mt-6 space-y-4">
              <h2 className="text-base font-semibold sm:text-lg">Usage Limits</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <UsageIndicator
                  label="Notes"
                  used={usage.notesCount}
                  limit={limits.maxNotes}
                  unit="notes"
                />
                <UsageIndicator
                  label="Folders"
                  used={usage.foldersCount}
                  limit={limits.maxFolders}
                  unit="folders"
                />
              </div>

              {/* Show upgrade banner if approaching limits */}
              {(checkLimit('maxNotes').remaining <= 2 || checkLimit('maxFolders').remaining === 0) && (
                <UpgradeBanner
                  title="You're running out of space!"
                  description="Upgrade to Pro for unlimited notes, folders, and AI-powered features."
                  variant="default"
                  className="mt-6"
                />
              )}
            </div>
          )}
        </motion.div>
      </main>
      
      {/* Mobile bottom navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
