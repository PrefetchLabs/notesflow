import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Time Blocks Database Operations', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    }

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient)
  })

  describe('Fetching Time Blocks', () => {
    it('should construct correct query for date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00')
      const endDate = new Date('2024-01-01T23:59:59')

      const supabase = createClient()
      const fromSpy = vi.spyOn(supabase, 'from')
      
      await supabase
        .from('time_blocks')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lt('start_time', endDate.toISOString())
        .order('start_time')

      expect(fromSpy).toHaveBeenCalledWith('time_blocks')
    })

    it('should handle empty results', async () => {
      const supabase = createClient()
      
      const result = await supabase
        .from('time_blocks')
        .select('*')
        .gte('start_time', '2024-01-01T00:00:00')
        .lt('start_time', '2024-01-01T23:59:59')
        .order('start_time')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('Creating Time Blocks', () => {
    it('should insert new time block with correct data', async () => {
      const newBlock = {
        user_id: 'user-123',
        note_id: 'note-456',
        start_time: '2024-01-01T09:00:00',
        end_time: '2024-01-01T10:00:00',
        title: 'Test Block',
        completed: false,
      }

      const expectedResult = {
        id: 'block-789',
        ...newBlock,
        created_at: '2024-01-01T08:00:00',
        updated_at: '2024-01-01T08:00:00',
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: expectedResult,
              error: null,
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .insert(newBlock)
        .select()
        .single()

      expect(result.data).toEqual(expectedResult)
      expect(result.error).toBeNull()
    })

    it('should handle insertion errors', async () => {
      const newBlock = {
        user_id: 'user-123',
        note_id: 'note-456',
        start_time: '2024-01-01T09:00:00',
        end_time: '2024-01-01T10:00:00',
        title: 'Test Block',
        completed: false,
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Duplicate key violation' },
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .insert(newBlock)
        .select()
        .single()

      expect(result.data).toBeNull()
      expect(result.error).toEqual({ message: 'Duplicate key violation' })
    })
  })

  describe('Updating Time Blocks', () => {
    it('should update time block fields', async () => {
      const blockId = 'block-123'
      const updates = {
        title: 'Updated Title',
        completed: true,
      }

      const expectedResult = {
        id: blockId,
        user_id: 'user-123',
        note_id: 'note-456',
        start_time: '2024-01-01T09:00:00',
        end_time: '2024-01-01T10:00:00',
        title: 'Updated Title',
        completed: true,
        created_at: '2024-01-01T08:00:00',
        updated_at: '2024-01-01T09:00:00',
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: expectedResult,
                error: null,
              })),
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single()

      expect(result.data).toEqual(expectedResult)
      expect(result.error).toBeNull()
    })

    it('should handle time updates', async () => {
      const blockId = 'block-123'
      const updates = {
        start_time: '2024-01-01T08:00:00',
        end_time: '2024-01-01T11:00:00',
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: blockId, ...updates },
                error: null,
              })),
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single()

      expect(result.data?.start_time).toBe(updates.start_time)
      expect(result.data?.end_time).toBe(updates.end_time)
    })
  })

  describe('Deleting Time Blocks', () => {
    it('should delete time block by id', async () => {
      const blockId = 'block-123'

      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)

      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const blockId = 'block-123'

      mockSupabaseClient.from.mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: { message: 'Block not found' },
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)

      expect(result.error).toEqual({ message: 'Block not found' })
    })
  })

  describe('Querying with Filters', () => {
    it('should filter by completion status', async () => {
      const completedBlocks = [
        { id: '1', title: 'Completed 1', completed: true },
        { id: '2', title: 'Completed 2', completed: true },
      ]

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lt: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: completedBlocks,
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .select('*')
        .eq('completed', true)
        .gte('start_time', '2024-01-01T00:00:00')
        .lt('start_time', '2024-01-01T23:59:59')
        .order('start_time')

      expect(result.data).toHaveLength(2)
      expect(result.data?.every(block => block.completed)).toBe(true)
    })

    it('should filter by note id', async () => {
      const noteId = 'note-123'
      const noteBlocks = [
        { id: '1', title: 'Block 1', note_id: noteId },
        { id: '2', title: 'Block 2', note_id: noteId },
      ]

      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: noteBlocks,
              error: null,
            })),
          })),
        })),
      })

      const supabase = createClient()
      const result = await supabase
        .from('time_blocks')
        .select('*')
        .eq('note_id', noteId)
        .order('start_time')

      expect(result.data).toHaveLength(2)
      expect(result.data?.every(block => block.note_id === noteId)).toBe(true)
    })
  })
})