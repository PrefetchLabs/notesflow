'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersFilters } from '@/components/admin/users/users-filters';
import { UsersPagination } from '@/components/admin/users/users-pagination';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-hooks';
import { toast } from 'sonner';
import { UserPlus, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  role: 'user' | 'admin' | 'system_admin';
  isSystemAdmin: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAdminActivityAt: Date | null;
  subscription: Subscription | null;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, search, roleFilter]);

  // Update user
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      toast.success('User updated successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Update user subscription
  const handleUpdateSubscription = async (userId: string, plan: string, action: string = 'changePlan') => {
    try {
      const response = await fetch('/api/admin/users/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan, action }),
      });

      if (!response.ok) throw new Error('Failed to update subscription');

      toast.success('Subscription updated successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    toast.error('Delete functionality not implemented yet');
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setPage(1);
  };

  // Export users
  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsersFilters
            search={search}
            role={roleFilter}
            onSearchChange={setSearch}
            onRoleChange={setRoleFilter}
            onReset={handleResetFilters}
          />

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8">
              <p className="text-center text-muted-foreground">
                No users found matching your criteria
              </p>
            </div>
          ) : (
            <>
              <UsersTable
                users={users}
                onUpdateUser={handleUpdateUser}
                onUpdateSubscription={handleUpdateSubscription}
                onDeleteUser={handleDeleteUser}
                currentUserId={currentUser?.id || ''}
              />
              <UsersPagination
                page={page}
                totalPages={totalPages}
                limit={limit}
                totalUsers={totalUsers}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}