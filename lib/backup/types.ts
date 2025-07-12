export interface BackupMetadata {
  version: string;
  backupDate: string;
  userEmail: string;
  userId: string;
  metadata: {
    totalNotes: number;
    totalFolders: number;
    totalTimeBlocks: number;
    deletedItems: {
      notes: number;
      folders: number;
    };
  };
}

export interface BackupData {
  user: any;
  notes: BackupNote[];
  folders: BackupFolder[];
  timeBlocks: any[];
  collaborations: any[];
  aiUsage: any[];
  preferences: any;
  subscription: any;
}

export interface BackupNote {
  id: string;
  title: string;
  content: any;
  userId: string;
  folderId: string | null;
  tags: string[] | null;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  deletedAt: string | null;
  lastEditedBy: string | null;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    backupTimestamp: string;
    originalPath?: string;
    size?: number;
  };
}

export interface BackupFolder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  path: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  childCount?: number;
  deletedAt?: string | null;
}

export interface BackupFile extends BackupMetadata {
  data: BackupData;
}

export interface RestoreOptions {
  mode: 'full' | 'note' | 'folder' | 'deleted' | 'pattern' | 'timeRange';
  itemId?: string;
  itemName?: string;
  pattern?: string;
  since?: string;
  type?: 'notes' | 'folders' | 'timeBlocks';
  dryRun?: boolean;
  conflictResolution?: 'skip' | 'rename' | 'replace' | 'keepBoth';
  restoreDeleted?: boolean;
  preserveTimestamps?: boolean;
}

export interface RestoreResult {
  success: boolean;
  restored: {
    notes: number;
    folders: number;
    timeBlocks: number;
  };
  skipped: {
    notes: number;
    folders: number;
    timeBlocks: number;
  };
  errors: string[];
  conflicts: ConflictItem[];
  idMappings: Record<string, string>;
}

export interface ConflictItem {
  type: 'note' | 'folder';
  existing: any;
  incoming: any;
  resolution?: 'skip' | 'rename' | 'replace' | 'keepBoth';
}

export interface BackupProgress {
  current: number;
  total: number;
  phase: string;
  item?: string;
}