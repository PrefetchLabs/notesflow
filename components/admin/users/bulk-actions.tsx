'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, ShieldOff, Trash2, MoreHorizontal } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string) => void;
}

export function BulkActions({ selectedCount, onBulkAction }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
      <span className="text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? 'user' : 'users'} selected
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm">
            Actions
            <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onBulkAction('makeAdmin')}>
            <Shield className="mr-2 h-4 w-4" />
            Make Admin
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onBulkAction('removeAdmin')}>
            <ShieldOff className="mr-2 h-4 w-4" />
            Remove Admin
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onBulkAction('delete')}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Users
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onBulkAction('clear')}
      >
        Clear selection
      </Button>
    </div>
  );
}