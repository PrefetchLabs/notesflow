'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authClient, useSession as useAuthSession } from './auth-client';
import type { auth } from './config';

type Session = typeof auth.$Infer.Session;
type User = Session['user'] & {
  role?: 'user' | 'admin' | 'system_admin';
  isActive?: boolean;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading } = useAuthSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Check if user is active
      if (session.user.isActive === false) {
        setUser(null);
        // Sign out disabled users
        authClient.signOut().then(() => {
          router.push('/login?error=account_disabled');
        });
      } else {
        setUser(session.user);
      }
    } else {
      setUser(null);
    }
  }, [session, router]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/login');
    } catch (error) {
      // [REMOVED_CONSOLE]
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}