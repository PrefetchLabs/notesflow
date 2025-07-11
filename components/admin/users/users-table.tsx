'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, ShieldOff, Trash2, CreditCard, Zap, Crown, UserX, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UserRole } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Subscription {
  id: string | null;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  usage?: any;
  limits?: any;
  metadata?: any;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  isSystemAdmin: boolean;
  emailVerified: boolean;
  isActive: boolean;
  disabledAt: Date | null;
  disabledReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastAdminActivityAt: Date | null;
  subscription: Subscription | null;
}

interface UsersTableProps {
  users: User[];
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onUpdateSubscription: (userId: string, plan: string, action?: string) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
}

const roleColors: Record<UserRole, string> = {
  user: 'bg-gray-500',
  admin: 'bg-blue-500',
  system_admin: 'bg-purple-500',
};

const roleLabels: Record<UserRole, string> = {
  user: 'User',
  admin: 'Admin',
  system_admin: 'System Admin',
};

export function UsersTable({ 
  users, 
  onUpdateUser, 
  onUpdateSubscription,
  onDeleteUser,
  currentUserId 
}: UsersTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: () => void;
    title: string;
    description: string;
  }>({
    open: false,
    action: () => {},
    title: '',
    description: '',
  });

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  const showConfirmDialog = (title: string, description: string, action: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      description,
      action,
    });
  };

  const getSubscriptionBadge = (subscription: Subscription | null) => {
    if (!subscription || !subscription.plan) {
      return <Badge variant="secondary">Free</Badge>;
    }

    const plan = subscription.plan;
    
    if (plan === 'beta') {
      return (
        <Badge className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
          <Zap className="h-3 w-3 mr-1" />
          Beta
        </Badge>
      );
    }
    
    if (plan === 'pro_monthly' || plan === 'pro_yearly') {
      return (
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      );
    }
    
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <>
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.length === users.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={!user.isActive ? 'opacity-60' : ''}>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleSelectUser(user.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.name || 'Unnamed User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="gap-1"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${roleColors[user.role]}`}
                  />
                  {roleLabels[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                {getSubscriptionBadge(user.subscription)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {!user.isActive ? (
                    <Badge variant="destructive" className="w-fit">
                      <UserX className="h-3 w-3 mr-1" />
                      Disabled
                    </Badge>
                  ) : (
                    <Badge variant="default" className="w-fit">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {user.emailVerified ? (
                    <Badge variant="secondary" className="w-fit text-xs">
                      Email verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit text-xs">
                      Email unverified
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(user.createdAt), { 
                    addSuffix: true 
                  })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'user' && (
                      <DropdownMenuItem
                        onClick={() => onUpdateUser(user.id, { role: 'admin' })}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem
                        onClick={() => onUpdateUser(user.id, { role: 'user' })}
                        disabled={user.id === currentUserId}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Remove Admin
                      </DropdownMenuItem>
                    )}
                    
                    {/* Account Status Management */}
                    {user.isActive ? (
                      <DropdownMenuItem
                        onClick={() => showConfirmDialog(
                          'Disable Account',
                          `Are you sure you want to disable ${user.name || user.email}'s account? They will not be able to log in until the account is re-enabled.`,
                          () => onUpdateUser(user.id, { isActive: false })
                        )}
                        disabled={user.id === currentUserId || user.role === 'system_admin'}
                        className="text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Disable Account
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => showConfirmDialog(
                          'Enable Account',
                          `Are you sure you want to enable ${user.name || user.email}'s account? They will be able to log in again.`,
                          () => onUpdateUser(user.id, { isActive: true })
                        )}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Enable Account
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    
                    {/* Subscription Management */}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Subscription
                    </DropdownMenuLabel>
                    {(!user.subscription || user.subscription.plan === 'free') && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onUpdateSubscription(user.id, 'beta')}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Convert to Beta Tester
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateSubscription(user.id, 'pro_monthly')}
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade to Pro
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.subscription?.plan === 'beta' && (
                      <DropdownMenuItem
                        onClick={() => onUpdateSubscription(user.id, 'free')}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Revert to Free
                      </DropdownMenuItem>
                    )}
                    {(user.subscription?.plan === 'pro_monthly' || user.subscription?.plan === 'pro_yearly') && (
                      <>
                        {user.subscription.cancelAtPeriodEnd ? (
                          <DropdownMenuItem
                            onClick={() => onUpdateSubscription(user.id, user.subscription!.plan!, 'reactivate')}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Reactivate Subscription
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onUpdateSubscription(user.id, user.subscription!.plan!, 'cancel')}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onUpdateSubscription(user.id, 'free')}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Downgrade to Free
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteUser(user.id)}
                      className="text-destructive"
                      disabled={user.id === currentUserId}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    <AlertDialog 
      open={confirmDialog.open} 
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirmDialog.action();
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}