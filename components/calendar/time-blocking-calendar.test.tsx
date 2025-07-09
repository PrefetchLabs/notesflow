import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { TimeBlockingCalendar } from './time-blocking-calendar'
import { DndContext } from '@dnd-kit/core'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef((props: any, ref: any) => {
      const { children, ...rest } = props
      return React.createElement('div', { ...rest, ref }, children)
    }),
    button: React.forwardRef((props: any, ref: any) => {
      const { children, ...rest } = props
      return React.createElement('button', { ...rest, ref }, children)
    }),
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock hooks data
const mockTimeBlocksData = {
  timeBlocks: [],
  isLoading: false,
  error: null,
  createTimeBlock: vi.fn(),
  updateTimeBlock: vi.fn(),
  deleteTimeBlock: vi.fn(),
  refetch: vi.fn(),
}

// Mock hooks
vi.mock('@/hooks/useTimeBlocks', () => ({
  useTimeBlocks: () => mockTimeBlocksData,
}))

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}))

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

describe('TimeBlockingCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock data
    mockTimeBlocksData.timeBlocks = []
    mockTimeBlocksData.isLoading = false
    mockTimeBlocksData.error = null
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DndContext>{children}</DndContext>
  )

  describe('Rendering', () => {
    it('should render calendar grid', () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      // Check for day headers
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.getByText('Fri')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('should render time slots', () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      // Check for some time labels
      expect(screen.getByText('6 AM')).toBeInTheDocument()
      expect(screen.getByText('12 PM')).toBeInTheDocument()
      expect(screen.getByText('6 PM')).toBeInTheDocument()
    })

    it('should render week navigation buttons', () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      expect(screen.getByRole('button', { name: /previous week/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next week/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
    })

    it('should render current time indicator', () => {
      const { container } = render(<TimeBlockingCalendar />, { wrapper })
      
      // Check for current time indicator component
      const indicator = container.querySelector('[data-testid="current-time-indicator"]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to previous week', async () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      const prevButton = screen.getByRole('button', { name: /previous week/i })
      await userEvent.click(prevButton)
      
      // Date display should update
      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
    })

    it('should navigate to next week', async () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      const nextButton = screen.getByRole('button', { name: /next week/i })
      await userEvent.click(nextButton)
      
      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
    })

    it('should navigate to today', async () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      // First navigate away
      const nextButton = screen.getByRole('button', { name: /next week/i })
      await userEvent.click(nextButton)
      
      // Then click today
      const todayButton = screen.getByRole('button', { name: /today/i })
      await userEvent.click(todayButton)
      
      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Time Block Creation', () => {
    it('should create time block on empty slot click', async () => {
      const mockCreateTimeBlock = vi.fn()
      mockTimeBlocksData.createTimeBlock = mockCreateTimeBlock

      const { container } = render(<TimeBlockingCalendar />, { wrapper })
      
      // Find an empty time slot
      const emptySlot = container.querySelector('[data-slot-time="2024-01-01T09:00:00"]')
      if (emptySlot) {
        await userEvent.click(emptySlot)
        
        // Should open dialog
        expect(screen.getByText('Create Time Block')).toBeInTheDocument()
      }
    })

    it('should submit new time block form', async () => {
      const mockCreateTimeBlock = vi.fn()
      mockTimeBlocksData.createTimeBlock = mockCreateTimeBlock

      const { container } = render(<TimeBlockingCalendar />, { wrapper })
      
      // Click empty slot
      const emptySlot = container.querySelector('[data-slot-time]')
      if (emptySlot) {
        await userEvent.click(emptySlot)
        
        // Fill form
        const titleInput = screen.getByLabelText(/title/i)
        await userEvent.type(titleInput, 'New Task')
        
        // Submit
        const submitButton = screen.getByRole('button', { name: /create/i })
        await userEvent.click(submitButton)
        
        await waitFor(() => {
          expect(mockCreateTimeBlock).toHaveBeenCalled()
        })
      }
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag start', () => {
      const timeBlocks = [{
        id: '1',
        noteId: 'note-1',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'Draggable Block',
        completed: false,
      }]

      mockTimeBlocksData.timeBlocks = timeBlocks

      render(<TimeBlockingCalendar />, { wrapper })
      
      const block = screen.getByText('Draggable Block')
      const dragEvent = new MouseEvent('mousedown', { bubbles: true })
      fireEvent(block, dragEvent)
      
      // Should initiate drag
      expect(block).toBeInTheDocument()
    })

    it('should show drop zones when dragging', () => {
      const timeBlocks = [{
        id: '1',
        noteId: 'note-1',
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T10:00:00'),
        title: 'Draggable Block',
        completed: false,
      }]

      mockTimeBlocksData.timeBlocks = timeBlocks

      const { container } = render(<TimeBlockingCalendar />, { wrapper })
      
      // Simulate drag start
      const block = screen.getByText('Draggable Block')
      fireEvent.mouseDown(block)
      
      // Check for drop zones
      const dropZones = container.querySelectorAll('[data-droppable]')
      expect(dropZones.length).toBeGreaterThan(0)
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      mockTimeBlocksData.isLoading = true

      render(<TimeBlockingCalendar />, { wrapper })
      
      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show error state', () => {
      mockTimeBlocksData.error = 'Failed to load time blocks'

      render(<TimeBlockingCalendar />, { wrapper })
      
      expect(screen.getByText(/failed to load time blocks/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should retry on error', async () => {
      const mockRefetch = vi.fn()
      mockTimeBlocksData.error = 'Failed to load'
      mockTimeBlocksData.refetch = mockRefetch

      render(<TimeBlockingCalendar />, { wrapper })
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)
      
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible navigation buttons', () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      expect(screen.getByRole('button', { name: /previous week/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /next week/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /today/i })).toHaveAttribute('aria-label')
    })

    it('should support keyboard navigation', async () => {
      render(<TimeBlockingCalendar />, { wrapper })
      
      const prevButton = screen.getByRole('button', { name: /previous week/i })
      prevButton.focus()
      
      expect(document.activeElement).toBe(prevButton)
      
      // Trigger with keyboard
      fireEvent.keyDown(prevButton, { key: 'Enter' })
      
      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalled()
      })
    })

    it('should announce loading state to screen readers', () => {
      mockTimeBlocksData.isLoading = true

      const { container } = render(<TimeBlockingCalendar />, { wrapper })
      
      const loadingElement = container.querySelector('[role="status"]')
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<TimeBlockingCalendar />, { wrapper })
      
      // Mobile-specific elements or classes should be present
      const calendar = screen.getByRole('region', { name: /calendar/i })
      expect(calendar).toBeInTheDocument()
    })

    it('should show full layout on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      render(<TimeBlockingCalendar />, { wrapper })
      
      // All day columns should be visible
      expect(screen.getByText('Sun')).toBeVisible()
      expect(screen.getByText('Sat')).toBeVisible()
    })
  })
})