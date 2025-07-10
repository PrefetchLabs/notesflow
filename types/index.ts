// User types
export type UserRole = 'user' | 'admin' | 'system_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPro: boolean;
  stripeCustomerId?: string;
  // Admin-specific fields
  role: UserRole;
  isSystemAdmin: boolean;
  adminPermissions: string[];
  lastAdminActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Folder types
export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// Note types
export interface Note {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  content: any; // BlockNote JSON format
  lastEditedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Time block types
export interface TimeBlock {
  id: string;
  userId: string;
  noteId?: string;
  title: string;
  date: Date;
  startTime: string; // "09:00"
  duration: number; // minutes
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Collaborator types
export interface Collaborator {
  id: string;
  noteId: string;
  userId: string;
  addedAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
