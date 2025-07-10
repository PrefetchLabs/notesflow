'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UserPlus,
  Download,
  RefreshCw,
  AlertTriangle,
  Mail,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'destructive';
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      label: 'Add User',
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => toast.info('User management coming soon'),
    },
    {
      label: 'Export Data',
      icon: <Download className="h-4 w-4" />,
      onClick: () => toast.info('Export feature coming soon'),
    },
    {
      label: 'Sync Data',
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => toast.success('Data synced successfully'),
    },
    {
      label: 'System Alert',
      icon: <AlertTriangle className="h-4 w-4" />,
      onClick: () => toast.warning('No system alerts'),
      variant: 'secondary',
    },
    {
      label: 'Send Email',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => toast.info('Email feature coming soon'),
    },
    {
      label: 'Security Scan',
      icon: <Shield className="h-4 w-4" />,
      onClick: () => toast.success('Security scan completed'),
      variant: 'secondary',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              className="justify-start"
              onClick={action.onClick}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}