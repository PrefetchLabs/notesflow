'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const ONBOARDING_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      // Just mark onboarding as complete without creating sample note
      const prefResponse = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        }),
      });

      if (!prefResponse.ok) {
        throw new Error('Failed to update preferences');
      }

      router.push('/dashboard');
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to skip setup. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      // Create sample note
      const noteResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Welcome to NotesFlow',
          content: [
            {
              type: 'heading',
              props: {
                level: 1,
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [{ type: 'text', text: 'Welcome to NotesFlow! 🎉' }],
              children: [],
            },
            {
              type: 'paragraph',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [
                { 
                  type: 'text', 
                  text: 'NotesFlow combines note-taking with time-blocking to help you stay organized and productive.' 
                }
              ],
              children: [],
            },
            {
              type: 'heading',
              props: {
                level: 2,
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [{ type: 'text', text: 'Quick Tips:' }],
              children: [],
            },
            {
              type: 'bulletListItem',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [
                { 
                  type: 'text', 
                  text: 'Select any text and drag it to your calendar to create time blocks' 
                }
              ],
              children: [],
            },
            {
              type: 'bulletListItem',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [
                { 
                  type: 'text', 
                  text: 'Use / to access AI-powered commands' 
                }
              ],
              children: [],
            },
            {
              type: 'bulletListItem',
              props: {
                textColor: 'default',
                backgroundColor: 'default',
              },
              content: [
                { 
                  type: 'text', 
                  text: 'Organize notes in folders for better structure' 
                }
              ],
              children: [],
            },
          ],
        }),
      });

      if (!noteResponse.ok) {
        const errorData = await noteResponse.json();
        // [REMOVED_CONSOLE]
        // Don't throw error - sample note is optional
        toast.warning('Sample note could not be created, but you can start creating your own notes!');
      }

      // Mark onboarding as complete
      const prefResponse = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        }),
      });

      if (!prefResponse.ok) {
        throw new Error('Failed to update preferences');
      }

      // If user selected pro plan, redirect to upgrade
      if (selectedPlan === 'pro') {
        router.push('/upgrade?from=onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCompleting) return; // Don't process keys while completing
    
    if (e.key === 'Enter' && currentStep < ONBOARDING_STEPS) {
      handleNext();
    } else if (e.key === 'Escape') {
      handleSkip();
    }
  };

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Skip button */}
      <div className="absolute right-4 top-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={isCompleting}
        >
          Skip
        </Button>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            onClick={() => setCurrentStep(step)}
            className={`h-2 transition-all duration-300 ${
              step === currentStep
                ? 'w-8 bg-primary'
                : step < currentStep
                ? 'w-2 bg-primary/60'
                : 'w-2 bg-muted'
            } rounded-full`}
            aria-label={`Go to step ${step}`}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          {currentStep === 1 && <WelcomeScreen onNext={handleNext} />}
          {currentStep === 2 && <DemoScreen onNext={handleNext} onPrevious={handlePrevious} />}
          {currentStep === 3 && (
            <PlanSelectionScreen
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              onComplete={completeOnboarding}
              onPrevious={handlePrevious}
              isCompleting={isCompleting}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
      </motion.div>
      
      <h1 className="mb-4 text-4xl font-bold tracking-tight">
        Welcome to NotesFlow
      </h1>
      
      <p className="mb-8 text-xl text-muted-foreground">
        Your thoughts and time, beautifully unified
      </p>
      
      <Button size="lg" onClick={onNext} className="min-w-[200px]">
        Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function DemoScreen({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  return (
    <div className="text-center">
      <h2 className="mb-4 text-3xl font-bold">
        Drag to Schedule
      </h2>
      
      <p className="mb-8 text-lg text-muted-foreground">
        Select any text from your notes and drag it to your calendar
      </p>
      
      {/* Demo Animation */}
      <div className="relative mx-auto mb-8 h-64 w-full max-w-lg overflow-hidden rounded-lg border bg-muted/20">
        <motion.div
          className="absolute left-8 top-8 w-48 rounded-md border bg-background p-4 shadow-sm"
          animate={{
            x: [0, 200, 200, 0],
            y: [0, 0, 100, 100],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.3, 0.6, 1],
            ease: "easeInOut",
          }}
        >
          <p className="text-sm">Meeting with team about new features</p>
        </motion.div>
        
        <div className="absolute bottom-8 right-8 h-32 w-32 rounded-md border bg-primary/10">
          <div className="p-2 text-xs font-medium">Calendar</div>
          <motion.div
            className="mx-2 mb-2 h-20 rounded bg-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.5, 0.7, 1],
            }}
          />
        </div>
      </div>
      
      <p className="mb-8 text-sm text-muted-foreground">
        Try it yourself when you start using NotesFlow!
      </p>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onPrevious}>
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PlanSelectionScreen({
  selectedPlan,
  onSelectPlan,
  onComplete,
  onPrevious,
  isCompleting,
}: {
  selectedPlan: 'free' | 'pro';
  onSelectPlan: (plan: 'free' | 'pro') => void;
  onComplete: () => void;
  onPrevious: () => void;
  isCompleting: boolean;
}) {
  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      price: '$0',
      features: [
        '10 notes',
        '3 folders',
        'Basic calendar',
        'Local storage',
      ],
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$10/mo',
      badge: '7-day free trial',
      features: [
        'Unlimited notes',
        'Unlimited folders',
        'AI-powered features',
        'Real-time collaboration',
        'Priority support',
      ],
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-center text-3xl font-bold">
        Choose Your Plan
      </h2>
      
      <p className="mb-8 text-center text-lg text-muted-foreground">
        Start free or unlock all features with Pro
      </p>
      
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer p-6 transition-all ${
              selectedPlan === plan.id
                ? 'border-primary ring-2 ring-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelectPlan(plan.id)}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {plan.badge}
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold">{plan.price}</p>
            </div>
            
            <ul className="space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onPrevious} disabled={isCompleting}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={isCompleting}>
          {isCompleting ? 'Setting up...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
}