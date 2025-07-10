import { useSubscription } from '@/lib/contexts/subscription-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useAIAccess() {
  const { isPro, isLoading } = useSubscription();
  const router = useRouter();

  const checkAIAccess = () => {
    if (!isPro) {
      toast.error(
        'AI features are only available for Pro users',
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
    hasAIAccess: isPro,
    isLoading,
    checkAIAccess,
  };
}