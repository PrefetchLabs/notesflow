import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTimeBlocks } from './useTimeBlocks'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('useTimeBlocks Hook', () => {
  let queryClient: QueryClient
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

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

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const createElement = vi.fn((type: any, props: any) => {
      if (type === QueryClientProvider) {
        return props.children
      }
      return null
    })
    return createElement(QueryClientProvider, { client: queryClient, children })
  }

  describe('Fetching Time Blocks', () => {
    it('should fetch time blocks for a specific date', async () => {
      const mockTimeBlocks = [
        {
          id: '1',
          user_id: 'user-1',
          note_id: 'note-1',
          start_time: '2024-01-01T09:00:00',
          end_time: '2024-01-01T10:00:00',
          title: 'Test Block 1',
          completed: false,
          created_at: '2024-01-01T08:00:00',
          updated_at: '2024-01-01T08:00:00',
        },
        {
          id: '2',
          user_id: 'user-1',
          note_id: 'note-2',
          start_time: '2024-01-01T10:00:00',
          end_time: '2024-01-01T11:00:00',
          title: 'Test Block 2',
          completed: true,
          created_at: '2024-01-01T08:00:00',
          updated_at: '2024-01-01T08:00:00',
        },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockTimeBlocks,
                error: null,
              })),
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.timeBlocks).toHaveLength(2)
      expect(result.current.timeBlocks[0].title).toBe('Test Block 1')
      expect(result.current.timeBlocks[1].completed).toBe(true)
    })

    it('should handle fetch errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              order: vi.fn(() => ({
                data: null,
                error: { message: 'Failed to fetch' },
              })),
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch')
      expect(result.current.timeBlocks).toEqual([])
    })
  })

  describe('Creating Time Blocks', () => {
    it('should create a new time block', async () => {
      const newBlock = {
        noteId: 'note-1',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'New Block',
      }

      const createdBlock = {
        id: '3',
        user_id: 'user-1',
        note_id: 'note-1',
        start_time: '2024-01-01T09:00:00',
        end_time: '2024-01-01T10:00:00',
        title: 'New Block',
        completed: false,
        created_at: '2024-01-01T08:00:00',
        updated_at: '2024-01-01T08:00:00',
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: createdBlock,
              error: null,
            })),
          })),
        })),
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            lt: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [createdBlock],
                error: null,
              })),
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await act(async () => {
        await result.current.createTimeBlock(newBlock)
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('time_blocks')
      expect(queryClient.getQueryData(['time-blocks', '2024-01-01'])).toBeDefined()
    })

    it('should handle creation errors', async () => {
      const newBlock = {
        noteId: 'note-1',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'New Block',
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { message: 'Failed to create' },
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await expect(async () => {
        await act(async () => {
          await result.current.createTimeBlock(newBlock)
        })
      }).rejects.toThrow('Failed to create')
    })
  })

  describe('Updating Time Blocks', () => {
    it('should update an existing time block', async () => {
      const updates = {
        title: 'Updated Title',
        completed: true,
      }

      const updatedBlock = {
        id: '1',
        user_id: 'user-1',
        note_id: 'note-1',
        start_time: '2024-01-01T09:00:00',
        end_time: '2024-01-01T10:00:00',
        title: 'Updated Title',
        completed: true,
        created_at: '2024-01-01T08:00:00',
        updated_at: '2024-01-01T09:00:00',
      }

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: updatedBlock,
                error: null,
              })),
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await act(async () => {
        await result.current.updateTimeBlock('1', updates)
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('time_blocks')
    })

    it('should handle update errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Failed to update' },
              })),
            })),
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await expect(async () => {
        await act(async () => {
          await result.current.updateTimeBlock('1', { title: 'New Title' })
        })
      }).rejects.toThrow('Failed to update')
    })
  })

  describe('Deleting Time Blocks', () => {
    it('should delete a time block', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await act(async () => {
        await result.current.deleteTimeBlock('1')
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('time_blocks')
    })

    it('should handle deletion errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: { message: 'Failed to delete' },
          })),
        })),
      })

      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      await expect(async () => {
        await act(async () => {
          await result.current.deleteTimeBlock('1')
        })
      }).rejects.toThrow('Failed to delete')
    })
  })

  describe('Refetching', () => {
    it('should refetch time blocks', async () => {
      const { result } = renderHook(
        () => useTimeBlocks(new Date('2024-01-01')),
        { wrapper }
      )

      const refetchSpy = vi.spyOn(result.current, 'refetch')

      await act(async () => {
        await result.current.refetch()
      })

      expect(refetchSpy).toHaveBeenCalled()
    })
  })

  describe('Date Changes', () => {
    it('should refetch when date changes', async () => {
      const { result, rerender } = renderHook(
        ({ date }) => useTimeBlocks(date),
        {
          wrapper,
          initialProps: { date: new Date('2024-01-01') },
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change date
      rerender({ date: new Date('2024-01-02') })

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
      })
    })
  })
})