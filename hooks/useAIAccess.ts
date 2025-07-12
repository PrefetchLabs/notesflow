import { useSubscription } from '@/lib/contexts/subscription-context';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useAIAccess() {
  const { isPro, isLoading, isBeta } = useSubscription();
  const { user } = useAuth();
  const router = useRouter();

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin';
  
  // Admins, Pro users, and Beta users have AI access
  const hasAIAccess = isAdmin || isPro || isBeta;

  // Debug logging
  // [REMOVED_CONSOLE]

  const checkAIAccess = () => {
    if (!hasAIAccess) {
      toast.error(
        'AI features are only available for Beta and Pro users',
        {
          action: {
            label: 'Upgrade to Pro',
            onClick: () => router.push('/upgrade'),
          },
        }
      );
      return false;
    }
    return true;
  };

  return {
    hasAIAccess,
    isLoading,
    checkAIAccess,
  };
}