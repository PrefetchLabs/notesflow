'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  beta?: boolean;
  experimental?: boolean;
  requiresRestart?: boolean;
}

interface FeatureTogglesProps {
  features: Record<string, boolean>;
  onUpdate: (features: Record<string, boolean>) => void;
}

const AVAILABLE_FEATURES: Feature[] = [
  {
    id: 'collaboration',
    name: 'Real-time Collaboration',
    description: 'Enable multiple users to edit notes simultaneously',
    enabled: true,
    beta: true,
  },
  {
    id: 'ai_writing',
    name: 'AI Writing Assistant',
    description: 'Use AI to help write and improve content',
    enabled: true,
  },
  {
    id: 'version_history',
    name: 'Version History',
    description: 'Track and restore previous versions of notes',
    enabled: true,
  },
  {
    id: 'public_sharing',
    name: 'Public Note Sharing',
    description: 'Allow users to share notes publicly with a link',
    enabled: true,
  },
  {
    id: 'markdown_export',
    name: 'Markdown Export',
    description: 'Export notes in Markdown format',
    enabled: true,
  },
  {
    id: 'pdf_export',
    name: 'PDF Export',
    description: 'Export notes as PDF documents',
    enabled: true,
    beta: true,
  },
  {
    id: 'templates',
    name: 'Note Templates',
    description: 'Pre-built templates for common note types',
    enabled: false,
    experimental: true,
  },
  {
    id: 'plugins',
    name: 'Plugin System',
    description: 'Allow third-party plugins to extend functionality',
    enabled: false,
    experimental: true,
    requiresRestart: true,
  },
  {
    id: 'offline_mode',
    name: 'Offline Mode',
    description: 'Work on notes without internet connection',
    enabled: false,
    beta: true,
  },
  {
    id: 'mobile_app',
    name: 'Mobile App Features',
    description: 'Enhanced features for mobile applications',
    enabled: false,
  },
  {
    id: 'code_blocks',
    name: 'Enhanced Code Blocks',
    description: 'Syntax highlighting and code execution',
    enabled: true,
  },
  {
    id: 'math_rendering',
    name: 'Math Formula Rendering',
    description: 'Render LaTeX math formulas in notes',
    enabled: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send notifications to external services',
    enabled: false,
    beta: true,
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Allow programmatic access via REST API',
    enabled: false,
    requiresRestart: true,
  },
  {
    id: 'advanced_search',
    name: 'Advanced Search',
    description: 'Full-text search with filters and operators',
    enabled: true,
  },
];

export function FeatureToggles({ features, onUpdate }: FeatureTogglesProps) {
  const toggleFeature = (featureId: string, enabled: boolean) => {
    onUpdate({
      ...features,
      [featureId]: enabled,
    });
  };

  const groupedFeatures = {
    core: AVAILABLE_FEATURES.filter(f => !f.beta && !f.experimental),
    beta: AVAILABLE_FEATURES.filter(f => f.beta && !f.experimental),
    experimental: AVAILABLE_FEATURES.filter(f => f.experimental),
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Features</CardTitle>
            <CardDescription>
              Stable features available to all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedFeatures.core.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={feature.id} className="text-base">
                      {feature.name}
                    </Label>
                    {feature.requiresRestart && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Requires server restart
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Switch
                  id={feature.id}
                  checked={features[feature.id] ?? feature.enabled}
                  onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beta Features</CardTitle>
            <CardDescription>
              Features in testing phase, may have issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedFeatures.beta.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={feature.id} className="text-base">
                      {feature.name}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      Beta
                    </Badge>
                    {feature.requiresRestart && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Requires server restart
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Switch
                  id={feature.id}
                  checked={features[feature.id] ?? feature.enabled}
                  onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experimental Features</CardTitle>
            <CardDescription>
              Cutting-edge features that may be unstable or change
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedFeatures.experimental.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={feature.id} className="text-base">
                      {feature.name}
                    </Label>
                    <Badge variant="destructive" className="text-xs">
                      Experimental
                    </Badge>
                    {feature.requiresRestart && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Requires server restart
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Switch
                  id={feature.id}
                  checked={features[feature.id] ?? feature.enabled}
                  onCheckedChange={(checked) => toggleFeature(feature.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}