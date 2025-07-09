import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Note validations
export const createNoteSchema = z.object({
  title: z.string().optional(),
  content: z.any(), // BlockNote JSON
  folderId: z.string().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().optional(),
  content: z.any().optional(),
  folderId: z.string().optional(),
});

// Folder validations
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().optional(),
  position: z.number().optional(),
});

// Time block validations
export const createTimeBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  noteId: z.string().optional(),
  date: z.string().or(z.date()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z
    .number()
    .min(15, 'Minimum duration is 15 minutes')
    .multipleOf(15, 'Duration must be in 15-minute increments'),
});

export const updateTimeBlockSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.string().or(z.date()).optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  duration: z.number().min(15).multipleOf(15).optional(),
  completed: z.boolean().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateTimeBlockInput = z.infer<typeof createTimeBlockSchema>;
export type UpdateTimeBlockInput = z.infer<typeof updateTimeBlockSchema>;
