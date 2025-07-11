import { Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const folderColors = [
  'folder-blue',
  'folder-green',
  'folder-purple',
  'folder-pink',
  'folder-orange',
  'folder-yellow',
  'folder-red',
  'folder-indigo',
];

interface FolderIconProps {
  isOpen?: boolean;
  colorIndex?: number;
  className?: string;
}

export function FolderIcon({ isOpen, colorIndex, className }: FolderIconProps) {
  const Icon = isOpen ? FolderOpen : Folder;
  const colorClass = colorIndex !== undefined ? folderColors[colorIndex % folderColors.length] : folderColors[0];
  
  return <Icon className={cn(colorClass, className)} />;
}

// Helper function to get consistent color for a folder based on its name
export function getFolderColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % folderColors.length;
}