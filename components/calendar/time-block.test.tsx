import React from 'react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, fireEvent } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { TimeBlock } from './time-block'

// Mock framer-motion before imports
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef((props: any, ref: any) => {
      const { children, ...rest } = props
      return React.createElement('div', { ...rest, ref }, children)
    }),
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock hooks
const mockUpdateTimeBlock = vi.fn()
const mockDeleteTimeBlock = vi.fn()
const mockUseTimeBlocks = {
  timeBlocks: [],
  isLoading: false,
  error: null,
  createTimeBlock: vi.fn(),
  updateTimeBlock: mockUpdateTimeBlock,
  deleteTimeBlock: mockDeleteTimeBlock,
  refetch: vi.fn(),
}

vi.mock('@/hooks/useTimeBlocks', () => ({
  useTimeBlocks: () => mockUseTimeBlocks,
}))

describe('TimeBlock Component', () => {
  const defaultProps = {
    id: 'test-block-1',
    startTime: new Date('2024-01-01T09:00:00'),
    endTime: new Date('2024-01-01T10:00:00'),
    title: 'Test Block',
    noteId: 'note-1',
    completed: false,
    date: new Date('2024-01-01'),
    onUpdate: mockUpdateTimeBlock,
    onDelete: mockDeleteTimeBlock,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render time block with title', () => {
      render(<TimeBlock {...defaultProps} />)
      expect(screen.getByText('Test Block')).toBeInTheDocument()
    })

    it('should render time range', () => {
      render(<TimeBlock {...defaultProps} />)
      expect(screen.getByText('9:00 AM - 10:00 AM')).toBeInTheDocument()
    })

    it('should render checkbox', () => {
      render(<TimeBlock {...defaultProps} />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should render checkbox as checked when completed', () => {
      render(<TimeBlock {...defaultProps} completed={true} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should render with completed styles when completed', () => {
      const { container } = render(<TimeBlock {...defaultProps} completed={true} />)
      const block = container.firstChild as HTMLElement
      expect(block.className).toContain('opacity-60')
    })

    it('should render resize handles', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const resizeHandles = container.querySelectorAll('[data-resize-handle]')
      expect(resizeHandles).toHaveLength(2) // top and bottom
    })
  })

  describe('Interactions', () => {
    it('should toggle completion when checkbox is clicked', async () => {
      render(<TimeBlock {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      
      await userEvent.click(checkbox)
      
      expect(mockUpdateTimeBlock).toHaveBeenCalledWith(
        'test-block-1',
        { completed: true }
      )
      expect(navigator.vibrate).toHaveBeenCalledWith(10)
    })

    it('should delete block when delete button is clicked', async () => {
      render(<TimeBlock {...defaultProps} />)
      
      // Hover to show delete button
      const block = screen.getByText('Test Block').closest('.group')!
      fireEvent.mouseEnter(block)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await userEvent.click(deleteButton)
      
      expect(mockDeleteTimeBlock).toHaveBeenCalledWith('test-block-1')
      expect(navigator.vibrate).toHaveBeenCalledWith(10)
    })

    it('should not show delete button when not hovering', () => {
      render(<TimeBlock {...defaultProps} />)
      
      const deleteButton = screen.queryByRole('button', { name: /delete/i })
      expect(deleteButton).not.toBeInTheDocument()
    })

    it('should show delete button on hover', () => {
      render(<TimeBlock {...defaultProps} />)
      
      const block = screen.getByText('Test Block').closest('.group')!
      fireEvent.mouseEnter(block)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      expect(deleteButton).toBeInTheDocument()
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag start', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const block = container.firstChild as HTMLElement
      
      const dragEvent = new Event('mousedown', { bubbles: true })
      fireEvent(block, dragEvent)
      
      expect(block.style.cursor).toBe('grabbing')
    })

    it('should not start drag when clicking on checkbox', () => {
      render(<TimeBlock {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      
      const dragEvent = new Event('mousedown', { bubbles: true })
      fireEvent(checkbox, dragEvent)
      
      // Should not change cursor or start drag
      const block = checkbox.closest('.group')!
      expect(block.getAttribute('style')).not.toContain('cursor: grabbing')
    })

    it('should not start drag when clicking on delete button', () => {
      render(<TimeBlock {...defaultProps} />)
      
      // Hover to show delete button
      const block = screen.getByText('Test Block').closest('.group')!
      fireEvent.mouseEnter(block)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      const dragEvent = new Event('mousedown', { bubbles: true })
      fireEvent(deleteButton, dragEvent)
      
      expect(block.getAttribute('style')).not.toContain('cursor: grabbing')
    })
  })

  describe('Resize Functionality', () => {
    it('should start resize when dragging top handle', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const topHandle = container.querySelector('[data-resize-handle="top"]')!
      
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true })
      fireEvent(topHandle, mouseDownEvent)
      
      expect(topHandle.parentElement?.style.cursor).toBe('ns-resize')
    })

    it('should start resize when dragging bottom handle', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const bottomHandle = container.querySelector('[data-resize-handle="bottom"]')!
      
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true })
      fireEvent(bottomHandle, mouseDownEvent)
      
      expect(bottomHandle.parentElement?.style.cursor).toBe('ns-resize')
    })

    it('should update time when resizing top handle', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const topHandle = container.querySelector('[data-resize-handle="top"]')!
      
      // Start resize
      fireEvent.mouseDown(topHandle, { clientY: 100 })
      
      // Move up by 20px (1 slot)
      fireEvent.mouseMove(window, { clientY: 80 })
      
      // End resize
      fireEvent.mouseUp(window)
      
      expect(mockUpdateTimeBlock).toHaveBeenCalled()
    })

    it('should update time when resizing bottom handle', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const bottomHandle = container.querySelector('[data-resize-handle="bottom"]')!
      
      // Start resize
      fireEvent.mouseDown(bottomHandle, { clientY: 200 })
      
      // Move down by 20px (1 slot)
      fireEvent.mouseMove(window, { clientY: 220 })
      
      // End resize
      fireEvent.mouseUp(window)
      
      expect(mockUpdateTimeBlock).toHaveBeenCalled()
    })
  })

  describe('Animations', () => {
    it('should apply hover animations', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const block = container.firstChild as HTMLElement
      
      fireEvent.mouseEnter(block)
      
      // Check that hover state is applied
      expect(block.className).toContain('group')
    })

    it('should apply active animations on mousedown', () => {
      const { container } = render(<TimeBlock {...defaultProps} />)
      const block = container.firstChild as HTMLElement
      
      fireEvent.mouseDown(block)
      
      expect(block.style.cursor).toBe('grabbing')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible checkbox label', () => {
      render(<TimeBlock {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAccessibleName(/mark test block as complete/i)
    })

    it('should have accessible delete button', () => {
      render(<TimeBlock {...defaultProps} />)
      
      // Hover to show delete button
      const block = screen.getByText('Test Block').closest('.group')!
      fireEvent.mouseEnter(block)
      
      const deleteButton = screen.getByRole('button', { name: /delete time block/i })
      expect(deleteButton).toBeInTheDocument()
    })

    it('should support keyboard navigation for checkbox', async () => {
      render(<TimeBlock {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      
      checkbox.focus()
      expect(document.activeElement).toBe(checkbox)
      
      fireEvent.keyDown(checkbox, { key: ' ' })
      
      expect(mockUpdateTimeBlock).toHaveBeenCalledWith(
        'test-block-1',
        { completed: true }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing title gracefully', () => {
      render(<TimeBlock {...defaultProps} title="" />)
      // Should still render time range
      expect(screen.getByText('9:00 AM - 10:00 AM')).toBeInTheDocument()
    })

    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that should be truncated with ellipsis when it exceeds the available space in the time block'
      render(<TimeBlock {...defaultProps} title={longTitle} />)
      
      const titleElement = screen.getByText(longTitle)
      expect(titleElement.className).toContain('truncate')
    })

    it('should handle minimum duration blocks', () => {
      const props = {
        ...defaultProps,
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T09:15:00'), // 15 minutes
      }
      render(<TimeBlock {...props} />)
      
      expect(screen.getByText('9:00 AM - 9:15 AM')).toBeInTheDocument()
    })

    it('should handle multi-hour blocks', () => {
      const props = {
        ...defaultProps,
        startTime: new Date('2024-01-01T09:00:00'),
        endTime: new Date('2024-01-01T12:00:00'), // 3 hours
      }
      render(<TimeBlock {...props} />)
      
      expect(screen.getByText('9:00 AM - 12:00 PM')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle update errors gracefully', async () => {
      mockUpdateTimeBlock.mockRejectedValueOnce(new Error('Update failed'))
      
      render(<TimeBlock {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      
      await userEvent.click(checkbox)
      
      // Should still call the update function
      expect(mockUpdateTimeBlock).toHaveBeenCalled()
    })

    it('should handle delete errors gracefully', async () => {
      mockDeleteTimeBlock.mockRejectedValueOnce(new Error('Delete failed'))
      
      render(<TimeBlock {...defaultProps} />)
      
      // Hover to show delete button
      const block = screen.getByText('Test Block').closest('.group')!
      fireEvent.mouseEnter(block)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await userEvent.click(deleteButton)
      
      // Should still call the delete function
      expect(mockDeleteTimeBlock).toHaveBeenCalled()
    })
  })
})