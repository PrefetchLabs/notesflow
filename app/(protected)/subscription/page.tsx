'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { useAuth } from '@/lib/auth/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, CreditCard, Calendar, AlertCircle, ExternalLink, Shield, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ProBadge } from '@/components/upgrade/pro-badge';
import { UsageIndicator } from '@/components/upgrade/usage-indicator';
import { Badge } from '@/components/ui/badge';

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const {
    subscription,
    isPro,
    isBeta,
    isFreeTier,
    usage,
    limits,
    isInGracePeriod,
    gracePeriodDaysRemaining,
  } = useSubscription();
  
  const isAdmin = user?.role === 'admin';

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription & Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription, billing, and usage
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            {isPro && <ProBadge />}
            {isBeta && <Badge className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0"><Zap className="h-3 w-3 mr-1" />Beta</Badge>}
            {isAdmin && <Badge variant="secondary" className="ml-2"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'As an administrator, you have unlimited access to all features'
              : isPro 
              ? 'You have full access to all features' 
              : isBeta
              ? 'As a beta tester, you have enhanced access to help us test new features'
              : 'You are on the free plan with limited features'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {isAdmin ? 'Administrator' : isPro ? 'Pro' : isBeta ? 'Beta Tester' : 'Free'}
              </p>
              {!isAdmin && !isBeta && subscription?.metadata?.interval && (
                <p className="text-sm text-muted-foreground">
                  Billed {subscription.metadata.interval}ly
                </p>
              )}
              {isBeta && (
                <p className="text-sm text-muted-foreground">
                  Limited time access
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {isAdmin ? 'Unlimited' : isPro ? (subscription?.metadata?.interval === 'year' ? '$80' : '$8') : '$0'}
              </p>
              {!isAdmin && (
                <p className="text-sm text-muted-foreground">
                  per {subscription?.metadata?.interval || 'month'}
                </p>
              )}
            </div>
          </div>

          {subscription?.currentPeriodEnd && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}`
                    : `Renews on ${format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}`
                  }
                </span>
              </div>
            </div>
          )}

          {!isAdmin && isInGracePeriod && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    Payment Issue
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    There was an issue with your payment. You have {gracePeriodDaysRemaining} days 
                    to update your payment method before your subscription is downgraded.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isAdmin ? (
            <div className="text-sm text-muted-foreground">
              Admin accounts have unrestricted access to all features.
            </div>
          ) : isPro ? (
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/upgrade')}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Track your resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageIndicator
              label="Notes"
              used={usage.notesCount}
              limit={isAdmin || isPro ? Infinity : limits.maxNotes}
              unit="notes"
            />
            <UsageIndicator
              label="Folders"
              used={usage.foldersCount}
              limit={isAdmin || isPro ? Infinity : limits.maxFolders}
              unit="folders"
            />
            <UsageIndicator
              label="AI Requests"
              used={usage.aiCallsCount}
              limit={isAdmin || isPro ? Infinity : limits.maxAiCalls}
              unit="requests"
            />
            <UsageIndicator
              label="Collaborators"
              used={usage.collaboratorsCount}
              limit={isAdmin || isPro ? Infinity : limits.maxCollaborators}
              unit="people"
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing History Link */}
      {!isAdmin && isPro && (
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={handleManageSubscription}
            className="text-muted-foreground"
          >
            View billing history and invoices
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}