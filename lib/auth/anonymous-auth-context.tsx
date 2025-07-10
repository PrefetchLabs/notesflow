'use client';

import React, { createContext, useContext } from 'react';

interface AnonymousUser {
  id: string;
  name: string;
  email: string;
}

interface AnonymousAuthContextType {
  user: AnonymousUser | null;
  session: null;
  isLoading: false;
  signOut: () => void;
}

const AnonymousAuthContext = createContext<AnonymousAuthContextType | undefined>(undefined);

interface AnonymousAuthProviderProps {
  children: React.ReactNode;
  user: AnonymousUser | null;
}

export function AnonymousAuthProvider({ children, user }: AnonymousAuthProviderProps) {
  const value: AnonymousAuthContextType = {
    user,
    session: null,
    isLoading: false,
    signOut: () => {
      // No-op for anonymous users
    },
  };

  return (
    <AnonymousAuthContext.Provider value={value}>
      {children}
    </AnonymousAuthContext.Provider>
  );
}

export function useAnonymousAuth() {
  const context = useContext(AnonymousAuthContext);
  if (context === undefined) {
    throw new Error('useAnonymousAuth must be used within an AnonymousAuthProvider');
  }
  return context;
}