'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { createAuthClient } from 'better-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000',
});

export default function LoginPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'account_disabled') {
      toast({
        title: 'Account Disabled',
        description: 'Your account has been disabled. Please contact support for assistance.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in with Google',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Welcome to NotesFlow</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        {error === 'account_disabled' && (
          <div className="px-6 pb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account has been disabled. Please contact support for assistance.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}