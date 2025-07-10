'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <motion.div
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <motion.div 
              className="mx-auto mb-4"
              variants={itemVariants}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
                <div className="relative bg-primary rounded-full p-3">
                  <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                Welcome to Pro! <Sparkles className="h-6 w-6 text-primary" />
              </CardTitle>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <CardDescription className="text-base mt-2">
                Your payment was successful and your account has been upgraded.
              </CardDescription>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <motion.div 
              className="space-y-3"
              variants={itemVariants}
            >
              <h3 className="font-semibold text-sm text-muted-foreground">
                You now have access to:
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Unlimited notes and folders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>AI-powered writing assistant</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Real-time collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Priority support</span>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              className="space-y-3"
              variants={itemVariants}
            >
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/notes/new')}
              >
                Create Your First Pro Note
              </Button>
            </motion.div>

            <motion.p 
              className="text-xs text-center text-muted-foreground"
              variants={itemVariants}
            >
              A confirmation email has been sent to your registered email address.
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}