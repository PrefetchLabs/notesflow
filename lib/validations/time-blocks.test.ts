import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Time block validation schemas
export const timeBlockSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  noteId: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createTimeBlockSchema = timeBlockSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
})

export const updateTimeBlockSchema = timeBlockSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
})

// Validation functions
export function validateTimeBlockDuration(startTime: Date, endTime: Date): boolean {
  return endTime > startTime
}

export function validateTimeBlockOverlap(
  newBlock: { startTime: Date; endTime: Date },
  existingBlocks: Array<{ startTime: Date; endTime: Date }>
): boolean {
  return !existingBlocks.some(
    block => newBlock.startTime < block.endTime && block.startTime < newBlock.endTime
  )
}

export function validateTimeBlockWithinBounds(
  startTime: Date,
  endTime: Date,
  minHour: number = 6,
  maxHour: number = 22
): boolean {
  const startHour = startTime.getHours()
  const endHour = endTime.getHours()
  const endMinutes = endTime.getMinutes()
  
  // Check if start is within bounds
  if (startHour < minHour || startHour >= maxHour) {
    return false
  }
  
  // Check if end is within bounds (allow exactly maxHour:00)
  if (endHour > maxHour || (endHour === maxHour && endMinutes > 0)) {
    return false
  }
  
  return true
}

describe('Time Block Validations', () => {
  describe('Schema Validation', () => {
    it('should validate a complete time block', () => {
      const validBlock = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'user-123',
        noteId: 'note-456',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'Test Block',
        completed: false,
        createdAt: new Date('2024-01-01T08:00:00'),
        updatedAt: new Date('2024-01-01T08:00:00'),
      }

      expect(() => timeBlockSchema.parse(validBlock)).not.toThrow()
    })

    it('should reject invalid UUID', () => {
      const invalidBlock = {
        id: 'not-a-uuid',
        userId: 'user-123',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'Test Block',
        completed: false,
        createdAt: new Date('2024-01-01T08:00:00'),
        updatedAt: new Date('2024-01-01T08:00:00'),
      }

      expect(() => timeBlockSchema.parse(invalidBlock)).toThrow()
    })

    it('should validate create schema without system fields', () => {
      const newBlock = {
        noteId: 'note-456',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'Test Block',
        completed: false,
      }

      expect(() => createTimeBlockSchema.parse(newBlock)).not.toThrow()
    })

    it('should validate partial update schema', () => {
      const updates = {
        title: 'Updated Title',
        completed: true,
      }

      expect(() => updateTimeBlockSchema.parse(updates)).not.toThrow()
    })

    it('should reject empty title', () => {
      const invalidBlock = {
        noteId: 'note-456',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: '',
        completed: false,
      }

      expect(() => createTimeBlockSchema.parse(invalidBlock)).toThrow()
    })
  })

  describe('Duration Validation', () => {
    it('should accept valid duration', () => {
      const start = new Date('2024-01-01T09:00:00')
      const end = new Date('2024-01-01T10:00:00')
      
      expect(validateTimeBlockDuration(start, end)).toBe(true)
    })

    it('should reject end time before start time', () => {
      const start = new Date('2024-01-01T10:00:00')
      const end = new Date('2024-01-01T09:00:00')
      
      expect(validateTimeBlockDuration(start, end)).toBe(false)
    })

    it('should reject same start and end time', () => {
      const time = new Date('2024-01-01T09:00:00')
      
      expect(validateTimeBlockDuration(time, time)).toBe(false)
    })

    it('should accept minimum duration (15 minutes)', () => {
      const start = new Date('2024-01-01T09:00:00')
      const end = new Date('2024-01-01T09:15:00')
      
      expect(validateTimeBlockDuration(start, end)).toBe(true)
    })
  })

  describe('Overlap Validation', () => {
    const existingBlocks = [
      {
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
      },
      {
        startTime: new Date('2024-01-01T14:00:00'),
        endTime: new Date('2024-01-01T15:00:00'),
      },
    ]

    it('should allow non-overlapping block before', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T09:00:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(true)
    })

    it('should allow non-overlapping block after', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:00:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(true)
    })

    it('should reject overlapping block at start', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T08:30:00'),
        endTime: new Date('2024-01-01T09:30:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(false)
    })

    it('should reject overlapping block at end', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T09:30:00'),
        endTime: new Date('2024-01-01T10:30:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(false)
    })

    it('should reject block completely within existing', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T09:15:00'),
        endTime: new Date('2024-01-01T09:45:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(false)
    })

    it('should reject block completely containing existing', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T11:00:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBe(false)
    })

    it('should allow blocks with no existing blocks', () => {
      const newBlock = {
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
      }
      
      expect(validateTimeBlockOverlap(newBlock, [])).toBe(true)
    })
  })

  describe('Calendar Bounds Validation', () => {
    it('should accept blocks within calendar hours', () => {
      const start = new Date('2024-01-01T09:00:00')
      const end = new Date('2024-01-01T10:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end)).toBe(true)
    })

    it('should accept block starting at minimum hour', () => {
      const start = new Date('2024-01-01T06:00:00')
      const end = new Date('2024-01-01T07:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end)).toBe(true)
    })

    it('should accept block ending at maximum hour', () => {
      const start = new Date('2024-01-01T21:00:00')
      const end = new Date('2024-01-01T22:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end)).toBe(true)
    })

    it('should reject block starting before minimum hour', () => {
      const start = new Date('2024-01-01T05:00:00')
      const end = new Date('2024-01-01T06:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end)).toBe(false)
    })

    it('should reject block ending after maximum hour', () => {
      const start = new Date('2024-01-01T21:30:00')
      const end = new Date('2024-01-01T22:30:00')
      
      expect(validateTimeBlockWithinBounds(start, end)).toBe(false)
    })

    it('should accept custom bounds', () => {
      const start = new Date('2024-01-01T08:00:00')
      const end = new Date('2024-01-01T17:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end, 8, 17)).toBe(true)
    })

    it('should reject based on custom bounds', () => {
      const start = new Date('2024-01-01T07:00:00')
      const end = new Date('2024-01-01T08:00:00')
      
      expect(validateTimeBlockWithinBounds(start, end, 8, 17)).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle daylight saving time transitions', () => {
      // Spring forward (2 AM -> 3 AM)
      const dstStart = new Date('2024-03-10T01:00:00')
      const dstEnd = new Date('2024-03-10T04:00:00')
      
      expect(validateTimeBlockDuration(dstStart, dstEnd)).toBe(true)
    })

    it('should handle midnight crossing', () => {
      const start = new Date('2024-01-01T23:00:00')
      const end = new Date('2024-01-02T01:00:00')
      
      // This would be rejected by bounds validation but duration is valid
      expect(validateTimeBlockDuration(start, end)).toBe(true)
    })

    it('should handle very long blocks', () => {
      const start = new Date('2024-01-01T06:00:00')
      const end = new Date('2024-01-01T22:00:00')
      
      expect(validateTimeBlockDuration(start, end)).toBe(true)
      expect(validateTimeBlockWithinBounds(start, end)).toBe(true)
    })
  })
})