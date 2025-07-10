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
import { 
  MoreHorizontal, 
  Eye, 
  Flag, 
  Trash2, 
  FileText, 
  Folder,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentItem {
  id: string;
  type: 'note' | 'folder';
  title: string;
  content: any;
  userId: string;
  userName: string | null;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  flagged: boolean;
}

interface ContentTableProps {
  content: ContentItem[];
  onViewContent: (item: ContentItem) => void;
  onFlagContent: (item: ContentItem) => void;
  onDeleteContent: (item: ContentItem) => void;
  onApproveContent: (item: ContentItem) => void;
}

const typeIcons = {
  note: FileText,
  folder: Folder,
};

const typeColors = {
  note: 'bg-blue-500',
  folder: 'bg-green-500',
};

export function ContentTable({ 
  content, 
  onViewContent,
  onFlagContent,
  onDeleteContent,
  onApproveContent
}: ContentTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedItems.length === content.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(content.map(item => item.id));
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getContentPreview = (item: ContentItem) => {
    if (item.type === 'folder') {
      return <span className="text-muted-foreground">Folder</span>;
    }
    
    // Extract text from BlockNote content
    try {
      if (Array.isArray(item.content)) {
        const firstBlock = item.content[0];
        if (firstBlock?.content?.[0]?.text) {
          return firstBlock.content[0].text.slice(0, 100) + '...';
        }
      }
    } catch (e) {
      // Fallback for malformed content
    }
    
    return <span className="text-muted-foreground">No preview available</span>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedItems.length === content.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{item.title || 'Untitled'}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {getContentPreview(item)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <Icon className="h-3 w-3" />
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{item.userName || 'Unknown'}</div>
                    <div className="text-muted-foreground">{item.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {item.flagged ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Flagged
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Clean
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(item.updatedAt), { 
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
                      <DropdownMenuItem onClick={() => onViewContent(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Content
                      </DropdownMenuItem>
                      {!item.flagged && (
                        <DropdownMenuItem onClick={() => onFlagContent(item)}>
                          <Flag className="mr-2 h-4 w-4" />
                          Flag Content
                        </DropdownMenuItem>
                      )}
                      {item.flagged && (
                        <DropdownMenuItem onClick={() => onApproveContent(item)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Content
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDeleteContent(item)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}