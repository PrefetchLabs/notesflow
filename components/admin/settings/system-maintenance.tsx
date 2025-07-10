'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Archive
} from 'lucide-react';

interface SystemMaintenanceProps {
  settings: {
    lastBackup?: Date;
    lastCleanup?: Date;
    lastOptimization?: Date;
    cacheSize?: number;
    dbSize?: number;
    storageUsed?: number;
    storageLimit?: number;
  };
  onUpdate: (updates: any) => void;
}

export function SystemMaintenance({ settings, onUpdate }: SystemMaintenanceProps) {
  const [operations, setOperations] = useState<Record<string, boolean>>({});

  const runOperation = async (operation: string, handler: () => Promise<void>) => {
    setOperations(prev => ({ ...prev, [operation]: true }));
    try {
      await handler();
      toast.success(`${operation} completed successfully`);
      onUpdate({ [`last${operation}`]: new Date() });
    } catch (error) {
      toast.error(`Failed to complete ${operation}`);
    } finally {
      setOperations(prev => ({ ...prev, [operation]: false }));
    }
  };

  const handleBackup = () => {
    runOperation('Backup', async () => {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
    });
  };

  const handleCleanup = () => {
    runOperation('Cleanup', async () => {
      // Simulate cleanup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      onUpdate({ cacheSize: 0 });
    });
  };

  const handleOptimization = () => {
    runOperation('Optimization', async () => {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 4000));
    });
  };

  const handleCacheClear = () => {
    runOperation('CacheClear', async () => {
      // Simulate cache clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdate({ cacheSize: 0 });
    });
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const storagePercentage = settings.storageLimit 
    ? (settings.storageUsed || 0) / settings.storageLimit * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(settings.dbSize)}</div>
            <p className="text-xs text-muted-foreground">
              PostgreSQL database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(settings.cacheSize)}</div>
            <p className="text-xs text-muted-foreground">
              Temporary files and cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(settings.storageUsed)} / {formatBytes(settings.storageLimit)}
            </div>
            <Progress value={storagePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Recovery</CardTitle>
          <CardDescription>
            Create backups and manage system recovery points
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Database Backup</p>
              <p className="text-sm text-muted-foreground">
                Last backup: {formatDate(settings.lastBackup)}
              </p>
            </div>
            <Button 
              onClick={handleBackup}
              disabled={operations.Backup}
            >
              {operations.Backup ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Create Backup
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Automated Backups</AlertTitle>
            <AlertDescription>
              Automated backups run daily at 3:00 AM UTC. Manual backups can be created anytime.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Optimization</CardTitle>
          <CardDescription>
            Optimize database performance and clean up temporary files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Database Optimization</p>
              <p className="text-sm text-muted-foreground">
                Last optimization: {formatDate(settings.lastOptimization)}
              </p>
            </div>
            <Button 
              variant="secondary"
              onClick={handleOptimization}
              disabled={operations.Optimization}
            >
              {operations.Optimization ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Clean Temporary Files</p>
              <p className="text-sm text-muted-foreground">
                Last cleanup: {formatDate(settings.lastCleanup)}
              </p>
            </div>
            <Button 
              variant="secondary"
              onClick={handleCleanup}
              disabled={operations.Cleanup}
            >
              {operations.Cleanup ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Up
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Current cache size: {formatBytes(settings.cacheSize)}
              </p>
            </div>
            <Button 
              variant="secondary"
              onClick={handleCacheClear}
              disabled={operations.CacheClear || !settings.cacheSize}
            >
              {operations.CacheClear ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Monitor system status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Database connection: Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Storage service: Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">CPU usage: 42% (moderate)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Memory usage: 68% (normal)</span>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" className="w-full">
              <Activity className="mr-2 h-4 w-4" />
              View Detailed Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}