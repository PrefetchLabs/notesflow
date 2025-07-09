import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/layouts/app-shell';
import { UnsavedChangesProvider } from '@/contexts/unsaved-changes-context';
import { KeyboardShortcutsProvider } from '@/components/providers/keyboard-shortcuts-provider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <KeyboardShortcutsProvider>
          <AppShell>{children}</AppShell>
        </KeyboardShortcutsProvider>
      </UnsavedChangesProvider>
    </AuthProvider>
  );
}
