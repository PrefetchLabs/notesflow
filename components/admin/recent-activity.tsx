'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: Date;
  type: 'user' | 'content' | 'system';
}

// Mock data - replace with real API data
const mockActivities: Activity[] = [
  {
    id: '1',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    action: 'created a new note',
    target: 'Project Ideas',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    type: 'content',
  },
  {
    id: '2',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    action: 'signed up',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'user',
  },
  {
    id: '3',
    user: {
      name: 'System',
      email: 'system@notesflow.com',
    },
    action: 'automated backup completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    type: 'system',
  },
];

const typeColors = {
  user: 'bg-blue-500',
  content: 'bg-green-500',
  system: 'bg-gray-500',
};

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback>
                  {activity.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    {activity.action}
                    {activity.target && (
                      <span className="font-medium"> "{activity.target}"</span>
                    )}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'h-2 w-2 rounded-full p-0',
                      typeColors[activity.type]
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}