'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Folder, 
  User, 
  Calendar, 
  Flag,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

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

interface ContentPreviewModalProps {
  content: ContentItem | null;
  open: boolean;
  onClose: () => void;
  onFlag: (item: ContentItem) => void;
  onApprove: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
}

export function ContentPreviewModal({
  content,
  open,
  onClose,
  onFlag,
  onApprove,
  onDelete,
}: ContentPreviewModalProps) {
  if (!content) return null;

  const renderContent = () => {
    if (content.type === 'folder') {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mr-4" />
          <span>Folder: {content.title}</span>
        </div>
      );
    }

    // Render note content
    try {
      if (Array.isArray(content.content)) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content.content.map((block: any, index: number) => {
              if (block.type === 'paragraph' && block.content?.[0]?.text) {
                return (
                  <p key={index} className="mb-4">
                    {block.content[0].text}
                  </p>
                );
              }
              if (block.type === 'heading') {
                const HeadingTag = `h${block.props?.level || 1}` as keyof JSX.IntrinsicElements;
                return (
                  <HeadingTag key={index} className="mb-4">
                    {block.content?.[0]?.text || ''}
                  </HeadingTag>
                );
              }
              return null;
            })}
          </div>
        );
      }
    } catch (e) {
      console.error('Error rendering content:', e);
    }

    return (
      <div className="text-muted-foreground">
        Unable to preview content
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {content.type === 'note' ? (
                <FileText className="h-5 w-5" />
              ) : (
                <Folder className="h-5 w-5" />
              )}
              {content.title || 'Untitled'}
            </DialogTitle>
            {content.flagged && (
              <Badge variant="destructive">Flagged</Badge>
            )}
          </div>
          <DialogDescription asChild>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{content.userName || 'Unknown'}</span>
                  <span className="text-muted-foreground">({content.userEmail})</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {format(new Date(content.createdAt), 'PPP')}</span>
                </div>
                <div>
                  Updated: {format(new Date(content.updatedAt), 'PPP')}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="my-4 max-h-[400px] pr-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            {renderContent()}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {content.flagged ? (
            <Button 
              variant="default" 
              onClick={() => {
                onApprove(content);
                onClose();
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          ) : (
            <Button 
              variant="secondary"
              onClick={() => {
                onFlag(content);
                onClose();
              }}
            >
              <Flag className="mr-2 h-4 w-4" />
              Flag
            </Button>
          )}
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this content?')) {
                onDelete(content);
                onClose();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}