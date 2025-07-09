'use client';

import { useState } from 'react';
import { Welcome } from '@/components/empty-states';
import { useAuth } from '@/lib/auth/auth-hooks';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MobileNav } from '@/components/layouts/mobile-nav';
import { useResponsive } from '@/hooks/useResponsive';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false);
  const { isMobile } = useResponsive();

  const handleGetStarted = () => {
    setHasStarted(true);
    // In the future, this would navigate to the main notes view
    // For now, we'll just update the state
  };

  if (!hasStarted) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Welcome 
          userName={user?.name?.split(' ')[0]} 
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
      
      <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-6">
        <motion.div 
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-muted-foreground">
            Welcome back! Your notes and folders will appear here.
          </p>
          
          <div className="mt-6 rounded-lg border bg-card p-4 sm:mt-8 sm:p-6">
            <h2 className="text-base font-semibold sm:text-lg">Quick Stats</h2>
            <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-3">
              <motion.div 
                className="rounded-lg bg-background p-3 sm:p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">Total Notes</p>
                <p className="text-xl font-bold sm:text-2xl">0</p>
              </motion.div>
              <motion.div 
                className="rounded-lg bg-background p-3 sm:p-4"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs text-muted-foreground sm:text-sm">Folders</p>
                <p className="text-xl font-bold sm:text-2xl">0</p>
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
        </motion.div>
      </main>
      
      {/* Mobile bottom navigation */}
      {isMobile && <MobileNav />}
    </div>
  );
}
