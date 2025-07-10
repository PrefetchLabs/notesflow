'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Link } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface ShareDialogProps {
  noteId: string;
  noteTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSharingEnabled?: () => void;
}

export function ShareDialog({ noteId, noteTitle, open, onOpenChange, onSharingEnabled }: ShareDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [copied, setCopied] = useState(false);

  // Generate shareable link
  const shareLink = `${window.location.origin}/shared/${noteId}`;

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Enable sharing mutation
  const enableSharing = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enable: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enable sharing');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Sharing enabled! Anyone with the link can now edit this note.");
      onSharingEnabled?.();
    },
    onError: () => {
      toast.error("Failed to enable sharing");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            {noteTitle ? `Share "${noteTitle}" with others` : 'Share this note with others'}. 
            Anyone with the link will be able to view and edit this note in real-time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link">Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                value={shareLink}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Link className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                When you share this link, anyone who has it will be able to:
              </span>
            </p>
            <ul className="mt-2 ml-6 space-y-1 list-disc">
              <li>View and edit the note in real-time</li>
              <li>See other collaborators' cursors</li>
              <li>Make changes that sync instantly</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              enableSharing.mutate();
              copyToClipboard();
            }}
            disabled={enableSharing.isPending}
          >
            {enableSharing.isPending ? "Enabling..." : "Enable Sharing & Copy Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}