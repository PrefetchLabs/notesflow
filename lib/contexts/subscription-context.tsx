'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import type { Subscription } from '@/lib/db/schema/subscriptions';

interface SubscriptionLimits {
  maxNotes: number;
  maxFolders: number;
  maxAiCalls: number;
  maxCollaborators: number;
  maxStorage: number;
}

interface SubscriptionUsage {
  notesCount: number;
  foldersCount: number;
  aiCallsCount: number;
  collaboratorsCount: number;
  storageUsed: number;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  limits: SubscriptionLimits;
  usage: SubscriptionUsage;
  isLoading: boolean;
  isPro: boolean;
  isFreeTier: boolean;
  isInGracePeriod: boolean;
  canCreateNote: boolean;
  canCreateFolder: boolean;
  canUseAI: boolean;
  canShare: boolean;
  refreshSubscription: () => Promise<void>;
  checkLimit: (feature: keyof SubscriptionLimits) => {
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
  };
}

const defaultLimits: SubscriptionLimits = {
  maxNotes: 10,
  maxFolders: 3,
  maxAiCalls: 0,
  maxCollaborators: 0,
  maxStorage: 100,
};

const defaultUsage: SubscriptionUsage = {
  notesCount: 0,
  foldersCount: 0,
  aiCallsCount: 0,
  collaboratorsCount: 0,
  storageUsed: 0,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const limits = subscription?.limits || defaultLimits;
  const usage = subscription?.usage || defaultUsage;
  const isPro = subscription?.plan !== 'free';
  const isFreeTier = subscription?.plan === 'free' || !subscription;
  const isInGracePeriod = subscription?.isInGracePeriod || false;

  const checkLimit = useCallback((feature: keyof SubscriptionLimits) => {
    const featureMap: Record<keyof SubscriptionLimits, keyof SubscriptionUsage> = {
      maxNotes: 'notesCount',
      maxFolders: 'foldersCount',
      maxAiCalls: 'aiCallsCount',
      maxCollaborators: 'collaboratorsCount',
      maxStorage: 'storageUsed',
    };

    const usageKey = featureMap[feature];
    const currentUsage = usage[usageKey];
    const limit = limits[feature];
    
    return {
      allowed: currentUsage < limit || isPro,
      current: currentUsage,
      limit: limit,
      remaining: Math.max(0, limit - currentUsage),
    };
  }, [limits, usage, isPro]);

  const value: SubscriptionContextType = {
    subscription,
    limits,
    usage,
    isLoading,
    isPro,
    isFreeTier,
    isInGracePeriod,
    canCreateNote: checkLimit('maxNotes').allowed,
    canCreateFolder: checkLimit('maxFolders').allowed,
    canUseAI: isPro || checkLimit('maxAiCalls').allowed,
    canShare: isPro || checkLimit('maxCollaborators').allowed,
    refreshSubscription: fetchSubscription,
    checkLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}