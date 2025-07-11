import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/layouts/app-shell';
import { UnsavedChangesProvider } from '@/contexts/unsaved-changes-context';
import { KeyboardShortcutsProvider } from '@/components/providers/keyboard-shortcuts-provider';
import { RealtimeCollaborationsProvider } from '@/components/providers/realtime-collaborations-provider';
import { SubscriptionProvider } from '@/lib/contexts/subscription-context';
import { checkOnboarding } from './layout-wrapper';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Check onboarding status before rendering
  await checkOnboarding();
  
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <UnsavedChangesProvider>
          <KeyboardShortcutsProvider>
            <RealtimeCollaborationsProvider>
              <AppShell>{children}</AppShell>
            </RealtimeCollaborationsProvider>
          </KeyboardShortcutsProvider>
        </UnsavedChangesProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
