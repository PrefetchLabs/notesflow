'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        const apiStats = data.stats;

        setStats([
          {
            title: 'Total Users',
            value: apiStats.totalUsers.toLocaleString(),
            description: `${apiStats.activeUsers} active in last 30 days`,
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: 'Total Notes',
            value: apiStats.totalNotes.toLocaleString(),
            description: 'Notes created across all users',
            icon: <FileText className="h-4 w-4" />,
          },
          {
            title: 'Total Folders',
            value: apiStats.totalFolders.toLocaleString(),
            description: 'Folders created across all users',
            icon: <Activity className="h-4 w-4" />,
          },
          {
            title: 'New Users Today',
            value: apiStats.newUsersToday.toLocaleString(),
            description: 'Users registered today',
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            title: 'AI Calls Today',
            value: apiStats.aiCallsToday.toLocaleString(),
            description: `${apiStats.aiCallsThisMonth.toLocaleString()} this month (${apiStats.totalAICalls.toLocaleString()} total)`,
            icon: <Sparkles className="h-4 w-4" />,
          },
        ]);
      } catch (error) {
        // [REMOVED_CONSOLE]
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}