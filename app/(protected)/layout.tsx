import { AuthProvider } from '@/lib/auth/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar and main content will be added here */}
        {children}
      </div>
    </AuthProvider>
  );
}
