'use client';

import { BookOpen, FolderPlus, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface WelcomeProps {
  userName?: string;
  onGetStarted: () => void;
}

export function Welcome({ userName, onGetStarted }: WelcomeProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

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


  return (
    <motion.div 
      className="flex min-h-[600px] flex-col items-center justify-center p-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-2xl text-center">
        <motion.h1 
          className="text-4xl font-bold tracking-tight"
          variants={itemVariants}
        >
          Welcome to NotesFlow{userName ? `, ${userName}` : ''}!
        </motion.h1>
        <motion.p 
          className="mt-4 text-lg text-muted-foreground"
          variants={itemVariants}
        >
          Your personal space for notes, ideas, and time management.
        </motion.p>

        <motion.div 
          className="mt-12 grid gap-8 sm:grid-cols-3"
          variants={itemVariants}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.title} 
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className="h-8 w-8 text-primary" />
                </motion.div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onGetStarted}
              size="lg"
              className="mt-12"
            >
              Get Started
              <motion.span
                className="ml-2 inline-block"
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>

        <motion.p 
          className="mt-8 text-sm text-muted-foreground"
          variants={itemVariants}
        >
          Tip: You can drag text from any note directly to the calendar to create time blocks
        </motion.p>
      </div>
    </motion.div>
  );
}