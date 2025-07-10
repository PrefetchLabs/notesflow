'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface GeneralSettingsProps {
  settings: {
    siteName?: string;
    siteDescription?: string;
    supportEmail?: string;
    timezone?: string;
    dateFormat?: string;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    registrationEnabled?: boolean;
    emailVerificationRequired?: boolean;
    maxNotesPerUser?: number;
    maxFoldersPerUser?: number;
    maxFileSize?: number;
  };
  onUpdate: (updates: any) => void;
}

export function GeneralSettings({ settings, onUpdate }: GeneralSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
          <CardDescription>
            Basic information about your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName || ''}
              onChange={(e) => onUpdate({ siteName: e.target.value })}
              placeholder="NotesFlow"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea
              id="siteDescription"
              value={settings.siteDescription || ''}
              onChange={(e) => onUpdate({ siteDescription: e.target.value })}
              placeholder="A collaborative note-taking platform"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => onUpdate({ supportEmail: e.target.value })}
              placeholder="support@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Configure timezone and date formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone || 'UTC'}
              onValueChange={(value) => onUpdate({ timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.dateFormat || 'MM/DD/YYYY'}
              onValueChange={(value) => onUpdate({ dateFormat: value })}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Control how users can register and access the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registrationEnabled">Enable Registration</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to create accounts
              </p>
            </div>
            <Switch
              id="registrationEnabled"
              checked={settings.registrationEnabled ?? true}
              onCheckedChange={(checked) => onUpdate({ registrationEnabled: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailVerification">Email Verification</Label>
              <p className="text-sm text-muted-foreground">
                Require email verification for new accounts
              </p>
            </div>
            <Switch
              id="emailVerification"
              checked={settings.emailVerificationRequired ?? true}
              onCheckedChange={(checked) => onUpdate({ emailVerificationRequired: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resource Limits</CardTitle>
          <CardDescription>
            Set default limits for user resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maxNotes">Max Notes per User</Label>
              <Input
                id="maxNotes"
                type="number"
                min="0"
                value={settings.maxNotesPerUser || 0}
                onChange={(e) => onUpdate({ maxNotesPerUser: parseInt(e.target.value) || 0 })}
                placeholder="0 (unlimited)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFolders">Max Folders per User</Label>
              <Input
                id="maxFolders"
                type="number"
                min="0"
                value={settings.maxFoldersPerUser || 0}
                onChange={(e) => onUpdate({ maxFoldersPerUser: parseInt(e.target.value) || 0 })}
                placeholder="0 (unlimited)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                min="1"
                value={settings.maxFileSize || 10}
                onChange={(e) => onUpdate({ maxFileSize: parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Temporarily disable access for maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Show maintenance message to all users
              </p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode ?? false}
              onCheckedChange={(checked) => onUpdate({ maintenanceMode: checked })}
            />
          </div>

          {settings.maintenanceMode && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={settings.maintenanceMessage || ''}
                  onChange={(e) => onUpdate({ maintenanceMessage: e.target.value })}
                  placeholder="We're currently performing maintenance. Please check back soon."
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}