'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/contexts/subscription-context';
import { motion } from 'framer-motion';

const proFeatures = [
  "Unlimited notes and folders",
  "AI-powered writing assistant",
  "Real-time collaboration",
  "Share notes with anyone",
  "Priority support",
  "Advanced export options",
  "7-day version history",
  "Custom themes",
  "Offline access",
  "API access"
];

export default function UpgradePage() {
  const router = useRouter();
  const { isInNewUserGracePeriod, gracePeriodDaysRemaining, usage, limits } = useSubscription();

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      // [REMOVED_CONSOLE]
      // You could show a toast here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Unlock the full potential of NotesFlow
          </p>
          
          {isInNewUserGracePeriod && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {gracePeriodDaysRemaining} days left in your free trial
              </span>
            </motion.div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">Up to {limits.maxNotes} notes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">Up to {limits.maxFolders} folders</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">Basic text editing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <span className="text-sm">Local storage</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Monthly */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pro <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>For power users</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$8</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proFeatures.slice(0, 6).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleUpgrade('monthly')}>
                Upgrade to Pro
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Yearly */}
          <Card className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                SAVE 17%
              </span>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pro Yearly <Sparkles className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>Best value</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$80</span>
                <span className="text-muted-foreground">/year</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  ~$6.67/month
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleUpgrade('yearly')}>
                Upgrade & Save
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Current Usage */}
        {usage && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Your Current Usage</CardTitle>
              <CardDescription>
                See how you're using NotesFlow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-2xl font-bold">
                    {usage.notesCount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{limits.maxNotes}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Folders</p>
                  <p className="text-2xl font-bold">
                    {usage.foldersCount}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{limits.maxFolders}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ or Support */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Questions? Contact us at{' '}
            <a href="mailto:support@notesflow.app" className="text-primary hover:underline">
              support@notesflow.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}