'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Zap,
  Download,
  Upload,
  RefreshCw,
  Save
} from 'lucide-react';
import { GeneralSettings } from '@/components/admin/settings/general-settings';
import { FeatureToggles } from '@/components/admin/settings/feature-toggles';
import { SubscriptionOverrides } from '@/components/admin/settings/subscription-overrides';
import { SystemMaintenance } from '@/components/admin/settings/system-maintenance';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      // [REMOVED_CONSOLE]
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Update settings
  const updateSettings = (section: string, updates: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  // Export configuration
  const exportConfig = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `notesflow-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Configuration exported successfully');
  };

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
        setHasChanges(true);
        toast.success('Configuration imported successfully');
      } catch (error) {
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Manage platform configuration and features
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportConfig}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-config')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            id="import-config"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importConfig}
          />
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={!hasChanges || saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-2 pt-6">
            <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              You have unsaved changes. Don't forget to save before leaving this page.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <Shield className="mr-2 h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Database className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings
            settings={settings.general || {}}
            onUpdate={(updates) => updateSettings('general', updates)}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureToggles
            features={settings.features || {}}
            onUpdate={(updates) => updateSettings('features', updates)}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionOverrides
            overrides={settings.subscriptions || []}
            onUpdate={(updates) => updateSettings('subscriptions', updates)}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <SystemMaintenance
            settings={settings.maintenance || {}}
            onUpdate={(updates) => updateSettings('maintenance', updates)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}