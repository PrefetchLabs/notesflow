import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/layouts/app-shell';
import { UnsavedChangesProvider } from '@/contexts/unsaved-changes-context';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <AppShell>{children}</AppShell>
      </UnsavedChangesProvider>
    </AuthProvider>
  );
}
