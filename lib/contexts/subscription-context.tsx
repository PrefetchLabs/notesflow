'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-hooks';
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
  isBeta: boolean;
  isFreeTier: boolean;
  isInGracePeriod: boolean;
  canCreateNote: boolean;
  canCreateFolder: boolean;
  canUseAI: boolean;
  canShare: boolean;
  refreshSubscription: () => Promise<void>;
  refetchSubscription: () => Promise<void>;
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
  isInBetaPeriod: boolean;
  betaDaysRemaining: number;
  betaHoursRemaining?: number;
  hasFeatureAccess: (feature: 'ai' | 'collaboration' | 'sharing' | 'unlimited' | 'themes' | 'export') => boolean;
  showFeatureLockedToast: (feature: string) => void;
}

const defaultLimits: SubscriptionLimits = {
  maxNotes: 10,
  maxFolders: 3,
  maxAiCalls: 10,
  maxCollaborators: 0,
  maxStorage: 100,
};

const betaLimits: SubscriptionLimits = {
  maxNotes: 50,
  maxFolders: 10,
  maxAiCalls: 100,
  maxCollaborators: 2,
  maxStorage: 500,
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
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // [REMOVED_CONSOLE]
      const response = await fetch('/api/subscription', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // [REMOVED_CONSOLE]
        setSubscription(data.subscription);
      }
    } catch (error) {
      // [REMOVED_CONSOLE]
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user is admin - admins get pro access
  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin';
  const isBeta = subscription?.plan === 'beta';
  const isPro = isAdmin || (subscription && (subscription.plan === 'pro_monthly' || subscription.plan === 'pro_yearly' || subscription.plan === 'early_bird'));
  const isFreeTier = !isAdmin && !isPro && !isBeta;

  // Debug logging for plan detection
  // [REMOVED_CONSOLE]
  
  const limits = subscription?.limits || (isBeta ? betaLimits : defaultLimits);
  const usage = subscription?.usage || defaultUsage;
  
  // Check if user is in any grace period (admins don't have grace periods)
  const now = new Date();
  // Only beta users have time-limited access, not regular free users
  const isInBetaPeriod = !isAdmin && isBeta && subscription?.metadata?.betaEndDate && 
    new Date(subscription.metadata.betaEndDate as string) > now;
  // Grace period only applies to paid users with payment issues, never to free users or beta users
  const isInOverageGracePeriod = !isAdmin && !isFreeTier && !isBeta && subscription?.isInGracePeriod && subscription?.gracePeriodEnd && 
    new Date(subscription.gracePeriodEnd) > now;
  const isInGracePeriod = !isAdmin && !isFreeTier && !isBeta && (isInOverageGracePeriod);

  const checkLimit = useCallback((feature: keyof SubscriptionLimits) => {
    // Admins have unlimited access
    if (isAdmin) {
      return {
        allowed: true,
        current: 0,
        limit: Infinity,
        remaining: Infinity,
        isInGracePeriod: false,
      };
    }

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
    
    // Beta users get their enhanced limits
    if (isBeta && isInBetaPeriod) {
      return {
        allowed: currentUsage < limit,
        current: currentUsage,
        limit: limit,
        remaining: Math.max(0, limit - currentUsage),
        isInGracePeriod: false,
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
  }, [limits, usage, isPro, isBeta, isInBetaPeriod, isInOverageGracePeriod, isAdmin]);

  const showUpgradePrompt = useCallback((feature: string, description?: string) => {
    showFeatureLockedToast(feature, description);
  }, []);

  const hasFeatureAccess = useCallback((feature: 'ai' | 'collaboration' | 'sharing' | 'unlimited' | 'themes' | 'export') => {
    // Admins have access to all features
    if (isAdmin) return true;
    
    // Beta users have access to enhanced features during their trial
    if (isBeta && isInBetaPeriod) {
      return feature !== 'unlimited'; // Beta users don't get unlimited access
    }
    
    // Pro users have access to all features
    if (isPro) return true;
    
    // Beta users have access to most features except unlimited and themes
    if (isBeta) {
      switch (feature) {
        case 'ai':
        case 'collaboration':
        case 'sharing':
        case 'export':
          return true;
        case 'unlimited':
        case 'themes':
          return false; // Pro-only features
        default:
          return false;
      }
    }
    
    // Free tier restrictions
    switch (feature) {
      case 'ai':
        return checkLimit('maxAiCalls').allowed;
      case 'collaboration':
      case 'sharing':
        return checkLimit('maxCollaborators').allowed;
      case 'unlimited':
      case 'themes':
      case 'export':
        return false; // Pro-only features
      default:
        return false;
    }
  }, [isPro, isBeta, isInBetaPeriod, checkLimit, isAdmin]);

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
  const betaDaysRemaining = useMemo(() => {
    if (!subscription || !isBeta) return 0;
    
    const endDate = subscription.metadata?.betaEndDate
      ? new Date(subscription.metadata.betaEndDate as string)
      : null;
      
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [subscription, isBeta]);

  // Calculate hours remaining for beta period
  const betaHoursRemaining = useMemo(() => {
    if (!subscription || !isBeta) return 0;
    
    const endDate = subscription.metadata?.betaEndDate
      ? new Date(subscription.metadata.betaEndDate as string)
      : null;
      
    if (!endDate) return 0;
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    return Math.max(0, diffHours);
  }, [subscription, isBeta]);

  const value: SubscriptionContextType = {
    subscription,
    limits,
    usage,
    isLoading,
    isPro,
    isBeta,
    isFreeTier,
    isInGracePeriod,
    canCreateNote: checkLimit('maxNotes').allowed,
    canCreateFolder: checkLimit('maxFolders').allowed,
    canUseAI: isPro || isBeta || checkLimit('maxAiCalls').allowed,
    canShare: isPro || isBeta || checkLimit('maxCollaborators').allowed,
    refreshSubscription: fetchSubscription,
    refetchSubscription: fetchSubscription,
    checkLimit,
    showUpgradePrompt,
    checkAndShowLimit,
    isInBetaPeriod,
    betaDaysRemaining,
    betaHoursRemaining,
    hasFeatureAccess,
    showFeatureLockedToast,
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