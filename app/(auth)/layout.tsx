import { AuthErrorBoundary } from '@/components/auth-error-boundary';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>
    </AuthErrorBoundary>
  );
}
