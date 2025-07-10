'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full p-3 w-fit">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-base mt-2">
            Your upgrade was cancelled and no charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You can upgrade anytime to unlock pro features. If you have any questions, 
            please don't hesitate to contact our support team.
          </p>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => router.push('/upgrade')}
            >
              Return to Pricing
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Need help? <a href="mailto:support@notesflow.app" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}