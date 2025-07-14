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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check, Link, Users, Globe, Mail, X, Shield } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/lib/contexts/subscription-context";
import { useRouter } from "next/navigation";

interface ShareDialogProps {
  noteId: string;
  noteTitle?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSharingEnabled?: () => void;
}

interface Collaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  permissionLevel: 'view' | 'edit' | 'admin';
  invitedAt: string;
  acceptedAt?: string;
}

export function ShareDialogV2({ noteId, noteTitle, open, onOpenChange, onSharingEnabled }: ShareDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { canShare, isBeta } = useSubscription();
  const router = useRouter();
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  
  // Check subscription before opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !canShare) {
      const message = isBeta 
        ? 'You have reached your collaborator limit. Upgrade to Pro for unlimited sharing.'
        : 'Sharing is only available for Beta and Pro users';
      toast.error(
        message,
        {
          action: {
            label: 'Upgrade to Pro',
            onClick: () => router.push('/upgrade'),
          },
        }
      );
      return;
    }
    setIsOpen(newOpen);
  };
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [isPublicViewEnabled, setIsPublicViewEnabled] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current collaborators
  const { data: sharingData, isLoading } = useQuery({
    queryKey: ['note-sharing', noteId],
    queryFn: async () => {
      const response = await fetch(`/api/notes/${noteId}/collaborators`);
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    },
    enabled: isOpen,
  });

  // Invite user mutation
  const inviteUser = useMutation({
    mutationFn: async ({ email, permission }: { email: string; permission: 'view' | 'edit' }) => {
      const response = await fetch(`/api/notes/${noteId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permission }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to invite user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('User invited successfully');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['note-sharing', noteId] });
      // Force refresh for the current user too
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['folders-with-notes'] });
      // Trigger refresh event for sidebar
      window.dispatchEvent(new Event('refresh-notes'));
      if (onSharingEnabled) {
        onSharingEnabled();
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Remove collaborator mutation
  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const response = await fetch(`/api/notes/${noteId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove collaborator');
    },
    onSuccess: () => {
      toast.success('Collaborator removed');
      queryClient.invalidateQueries({ queryKey: ['note-sharing', noteId] });
    },
    onError: () => {
      toast.error('Failed to remove collaborator');
    },
  });

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: async ({ collaboratorId, permission }: { collaboratorId: string; permission: 'view' | 'edit' }) => {
      const response = await fetch(`/api/notes/${noteId}/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });

      if (!response.ok) throw new Error('Failed to update permission');
    },
    onSuccess: () => {
      toast.success('Permission updated');
      queryClient.invalidateQueries({ queryKey: ['note-sharing', noteId] });
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });

  // Toggle public view mutation
  const togglePublicView = useMutation({
    mutationFn: async (enable: boolean) => {
      const response = await fetch(`/api/notes/${noteId}/public-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable }),
      });

      if (!response.ok) throw new Error('Failed to update public access');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.enabled) {
        toast.success('Public view link enabled');
        if (onSharingEnabled) {
          onSharingEnabled();
        }
      } else {
        toast.success('Public view link disabled');
      }
      queryClient.invalidateQueries({ queryKey: ['note-sharing', noteId] });
      // Trigger refresh event for sidebar
      window.dispatchEvent(new Event('refresh-notes'));
    },
    onError: () => {
      toast.error('Failed to update public access');
    },
  });

  const publicViewLink = sharingData?.publicAccess ? `${window.location.origin}/public/${noteId}` : '';

  const copyPublicLink = async () => {
    if (!publicViewLink) return;
    
    try {
      await navigator.clipboard.writeText(publicViewLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleInvite = () => {
    if (!email.trim()) return;
    inviteUser.mutate({ email: email.trim(), permission });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share "{noteTitle || 'Note'}"</DialogTitle>
          <DialogDescription>
            Invite people to collaborate or enable a public view-only link.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="collaborators" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collaborators">
              <Users className="mr-2 h-4 w-4" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger value="public">
              <Globe className="mr-2 h-4 w-4" />
              Public Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="space-y-4">
            {/* Invite form */}
            <div className="space-y-2">
              <Label>Invite people</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite();
                  }}
                />
                <Select value={permission} onValueChange={(v: 'view' | 'edit') => setPermission(v)}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        View
                      </span>
                    </SelectItem>
                    <SelectItem value="edit">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Edit
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleInvite}
                  disabled={!email.trim() || inviteUser.isPending}
                >
                  Invite
                </Button>
              </div>
            </div>

            {/* Collaborators list */}
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="rounded-lg border">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : sharingData?.collaborators?.length > 0 ? (
                  <div className="divide-y">
                    {sharingData.collaborators.map((collab: Collaborator) => (
                      <div key={collab.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={collab.userImage} />
                            <AvatarFallback>
                              {collab.userName?.charAt(0) || collab.userEmail?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {collab.userName || collab.userEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {collab.userEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={collab.permissionLevel}
                            onValueChange={(value: 'view' | 'edit') => {
                              updatePermission.mutate({
                                collaboratorId: collab.id,
                                permission: value,
                              });
                            }}
                            disabled={collab.permissionLevel === 'admin'}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="edit">Edit</SelectItem>
                              {collab.permissionLevel === 'admin' && (
                                <SelectItem value="admin" disabled>Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {collab.permissionLevel !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeCollaborator.mutate(collab.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No collaborators yet. Invite people to start collaborating!
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="public" className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public view-only link</Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this note
                  </p>
                </div>
                <Switch
                  checked={sharingData?.publicAccess || false}
                  onCheckedChange={(checked) => {
                    togglePublicView.mutate(checked);
                  }}
                  disabled={togglePublicView.isPending}
                />
              </div>

              {sharingData?.publicAccess && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={publicViewLink}
                      readOnly
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={copyPublicLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This link provides read-only access. Viewers cannot edit the note.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}