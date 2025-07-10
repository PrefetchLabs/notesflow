'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import type { Subscription } from '@/lib/db/schema/subscriptions';
import { showUsageLimitToast, showFeatureLockedToast } from '@/components/upgrade/usage-limit-toast';

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
    isInGracePeriod?: boolean;
    gracePeriodType?: 'new_user' | 'overage';
    isSoftLimitWarning?: boolean;
  };
  showUpgradePrompt: (feature: string, description?: string) => void;
  checkAndShowLimit: (feature: keyof SubscriptionLimits, featureName: string, unit?: string) => boolean;
  isInNewUserGracePeriod: boolean;
  gracePeriodDaysRemaining: number;
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
  
  // Check if user is in any grace period
  const now = new Date();
  const isInNewUserGracePeriod = subscription?.isNewUser && subscription?.newUserGracePeriodEnd && 
    new Date(subscription.newUserGracePeriodEnd) > now;
  const isInOverageGracePeriod = subscription?.isInGracePeriod && subscription?.gracePeriodEnd && 
    new Date(subscription.gracePeriodEnd) > now;
  const isInGracePeriod = isInNewUserGracePeriod || isInOverageGracePeriod;

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
    
    // Calculate soft limit (10% over the base limit)
    const softLimit = Math.floor(limit * 1.1);
    
    // During grace periods, allow full access or soft limits
    if (isInNewUserGracePeriod) {
      // New users get unlimited access for 7 days
      return {
        allowed: true,
        current: currentUsage,
        limit: limit,
        remaining: Infinity,
        isInGracePeriod: true,
        gracePeriodType: 'new_user',
      };
    }
    
    if (isInOverageGracePeriod && currentUsage <= softLimit) {
      // Users in overage grace period can go 10% over
      return {
        allowed: true,
        current: currentUsage,
        limit: limit,
        remaining: Math.max(0, softLimit - currentUsage),
        isInGracePeriod: true,
        gracePeriodType: 'overage',
        isSoftLimitWarning: currentUsage > limit,
      };
    }
    
    return {
      allowed: currentUsage < limit || isPro,
      current: currentUsage,
      limit: limit,
      remaining: Math.max(0, limit - currentUsage),
      isInGracePeriod: false,
    };
  }, [limits, usage, isPro, isInNewUserGracePeriod, isInOverageGracePeriod]);

  const showUpgradePrompt = useCallback((feature: string, description?: string) => {
    showFeatureLockedToast(feature, description);
  }, []);

  const checkAndShowLimit = useCallback((feature: keyof SubscriptionLimits, featureName: string, unit?: string) => {
    const result = checkLimit(feature);
    
    if (!result.allowed) {
      const featureUnits: Record<keyof SubscriptionLimits, string> = {
        maxNotes: 'notes',
        maxFolders: 'folders',
        maxAiCalls: 'AI calls',
        maxCollaborators: 'collaborators',
        maxStorage: 'MB',
      };
      
      showUsageLimitToast({
        feature: featureName,
        limit: result.limit,
        current: result.current,
        unit: unit || featureUnits[feature],
      });
      return true; // Limit reached
    }
    
    // Show soft limit warning if applicable
    if (result.isSoftLimitWarning) {
      showUsageLimitToast({
        feature: featureName,
        limit: result.limit,
        current: result.current,
        unit: unit || 'items',
      });
    }
    
    return false; // No hard limit reached
  }, [checkLimit]);

  // Calculate days remaining in grace period
  const gracePeriodDaysRemaining = useMemo(() => {
    if (!subscription) return 0;
    
    const endDate = subscription.isNewUser && subscription.newUserGracePeriodEnd
      ? new Date(subscription.newUserGracePeriodEnd)
      : subscription.gracePeriodEnd
      ? new Date(subscription.gracePeriodEnd)
      : null;
      
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [subscription]);

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
    showUpgradePrompt,
    checkAndShowLimit,
    isInNewUserGracePeriod,
    gracePeriodDaysRemaining,
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