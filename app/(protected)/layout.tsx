import { AuthProvider } from '@/lib/auth/auth-context';
import { AppShell } from '@/components/layouts/app-shell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
