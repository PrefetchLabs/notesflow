'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionOverride {
  id: string;
  userId: string;
  userEmail: string;
  type: 'pro' | 'enterprise' | 'lifetime';
  expiresAt?: Date;
  reason: string;
  createdAt: Date;
}

interface SubscriptionOverridesProps {
  overrides: SubscriptionOverride[];
  onUpdate: (overrides: SubscriptionOverride[]) => void;
}

export function SubscriptionOverrides({ overrides = [], onUpdate }: SubscriptionOverridesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<SubscriptionOverride | null>(null);
  
  // Form state
  const [userEmail, setUserEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'pro' | 'enterprise' | 'lifetime'>('pro');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [reason, setReason] = useState('');

  const resetForm = () => {
    setUserEmail('');
    setSubscriptionType('pro');
    setExpiresAt(undefined);
    setReason('');
    setEditingOverride(null);
  };

  const handleSubmit = async () => {
    if (!userEmail || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // TODO: Validate user exists via API
    const newOverride: SubscriptionOverride = {
      id: editingOverride?.id || Date.now().toString(),
      userId: editingOverride?.userId || 'pending', // Will be resolved by API
      userEmail,
      type: subscriptionType,
      expiresAt: subscriptionType !== 'lifetime' ? expiresAt : undefined,
      reason,
      createdAt: editingOverride?.createdAt || new Date(),
    };

    if (editingOverride) {
      onUpdate(overrides.map(o => o.id === editingOverride.id ? newOverride : o));
      toast.success('Override updated successfully');
    } else {
      onUpdate([...overrides, newOverride]);
      toast.success('Override created successfully');
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (override: SubscriptionOverride) => {
    setEditingOverride(override);
    setUserEmail(override.userEmail);
    setSubscriptionType(override.type);
    setExpiresAt(override.expiresAt);
    setReason(override.reason);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this subscription override?')) {
      onUpdate(overrides.filter(o => o.id !== id));
      toast.success('Override removed successfully');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pro':
        return 'default';
      case 'enterprise':
        return 'secondary';
      case 'lifetime':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Overrides</CardTitle>
              <CardDescription>
                Grant special subscription access to specific users
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Override
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingOverride ? 'Edit' : 'Add'} Subscription Override
                  </DialogTitle>
                  <DialogDescription>
                    Grant a user special subscription privileges
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">User Email</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={!!editingOverride}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Subscription Type</Label>
                    <Select
                      value={subscriptionType}
                      onValueChange={(value: any) => setSubscriptionType(value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {subscriptionType !== 'lifetime' && (
                    <div className="space-y-2">
                      <Label>Expires At</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !expiresAt && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresAt ? format(expiresAt, 'PPP') : 'No expiration'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={expiresAt}
                            onSelect={setExpiresAt}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Beta tester, Partner, etc."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingOverride ? 'Update' : 'Create'} Override
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8">
              <p className="text-center text-muted-foreground">
                No subscription overrides configured
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>{override.userEmail}</TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(override.type)}>
                          {override.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {override.type === 'lifetime' ? (
                          <span className="text-muted-foreground">Never</span>
                        ) : override.expiresAt ? (
                          format(new Date(override.expiresAt), 'PP')
                        ) : (
                          <span className="text-muted-foreground">No expiration</span>
                        )}
                      </TableCell>
                      <TableCell>{override.reason}</TableCell>
                      <TableCell>
                        {format(new Date(override.createdAt), 'PP')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(override)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(override.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
          <CardDescription>
            Import or export subscription overrides in bulk
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" size="sm">
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}