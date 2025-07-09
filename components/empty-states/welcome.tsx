'use client';

import { BookOpen, FolderPlus, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeProps {
  userName?: string;
  onGetStarted: () => void;
}

export function Welcome({ userName, onGetStarted }: WelcomeProps) {
  const features = [
    {
      icon: FolderPlus,
      title: 'Organize with folders',
      description: 'Create a folder structure that works for you',
    },
    {
      icon: BookOpen,
      title: 'Write beautiful notes',
      description: 'Rich text editor with powerful formatting',
    },
    {
      icon: Calendar,
      title: 'Plan your time',
      description: 'Drag notes to calendar for time-blocking',
    },
  ];

  // Removed complex animations for better performance

  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to NotesFlow{userName ? `, ${userName}` : ''}!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your personal space for notes, ideas, and time management.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title} 
                className="text-center transition-transform duration-200 hover:scale-105"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <Button
          onClick={onGetStarted}
          size="lg"
          className="mt-12 transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="mt-8 text-sm text-muted-foreground">
          Tip: You can drag text from any note directly to the calendar to create time blocks
        </p>
      </div>
    </div>
  );
}