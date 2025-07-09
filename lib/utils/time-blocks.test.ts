import { describe, it, expect } from 'vitest'
import {
  timeToSlotIndex,
  slotIndexToTime,
  timeToPixelPosition,
  durationToSlots,
  roundToNearestSlot,
  getWeekDates,
  formatTimeSlot,
  formatHourLabel,
  getTotalSlotsPerDay,
  isWithinCalendarBounds,
  getCalendarTimeRange,
  pixelPositionToTime,
  doTimeBlocksOverlap,
  groupOverlappingBlocks,
  calculateBlockLayout,
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  SLOT_DURATION_MINUTES,
  SLOT_HEIGHT_PX,
} from './time-blocks'

describe('Time Block Utilities', () => {
  describe('timeToSlotIndex', () => {
    it('should calculate correct slot index for start of day', () => {
      const date = new Date('2024-01-01T06:00:00') // 6 AM
      expect(timeToSlotIndex(date)).toBe(0)
    })

    it('should calculate correct slot index for 15-minute intervals', () => {
      const date1 = new Date('2024-01-01T06:15:00')
      expect(timeToSlotIndex(date1)).toBe(1)
      
      const date2 = new Date('2024-01-01T06:30:00')
      expect(timeToSlotIndex(date2)).toBe(2)
      
      const date3 = new Date('2024-01-01T07:00:00')
      expect(timeToSlotIndex(date3)).toBe(4)
    })

    it('should handle times before calendar start', () => {
      const date = new Date('2024-01-01T05:00:00') // 5 AM
      expect(timeToSlotIndex(date)).toBe(-4)
    })
  })

  describe('slotIndexToTime', () => {
    it('should convert slot index back to time', () => {
      const baseDate = new Date('2024-01-01')
      const time = slotIndexToTime(0, baseDate)
      expect(time.getHours()).toBe(CALENDAR_START_HOUR)
      expect(time.getMinutes()).toBe(0)
    })

    it('should handle multiple slot indices correctly', () => {
      const baseDate = new Date('2024-01-01')
      const time1 = slotIndexToTime(1, baseDate)
      expect(time1.getHours()).toBe(6)
      expect(time1.getMinutes()).toBe(15)
      
      const time2 = slotIndexToTime(4, baseDate)
      expect(time2.getHours()).toBe(7)
      expect(time2.getMinutes()).toBe(0)
    })
  })

  describe('timeToPixelPosition', () => {
    it('should calculate correct pixel position', () => {
      const date1 = new Date('2024-01-01T06:00:00')
      expect(timeToPixelPosition(date1)).toBe(0)
      
      const date2 = new Date('2024-01-01T06:15:00')
      expect(timeToPixelPosition(date2)).toBe(SLOT_HEIGHT_PX)
      
      const date3 = new Date('2024-01-01T07:00:00')
      expect(timeToPixelPosition(date3)).toBe(SLOT_HEIGHT_PX * 4)
    })
  })

  describe('durationToSlots', () => {
    it('should calculate correct number of slots for duration', () => {
      const start = new Date('2024-01-01T06:00:00')
      const end1 = new Date('2024-01-01T06:15:00')
      expect(durationToSlots(start, end1)).toBe(1)
      
      const end2 = new Date('2024-01-01T07:00:00')
      expect(durationToSlots(start, end2)).toBe(4)
      
      const end3 = new Date('2024-01-01T07:30:00')
      expect(durationToSlots(start, end3)).toBe(6)
    })

    it('should round up partial slots', () => {
      const start = new Date('2024-01-01T06:00:00')
      const end = new Date('2024-01-01T06:10:00') // 10 minutes
      expect(durationToSlots(start, end)).toBe(1)
    })
  })

  describe('roundToNearestSlot', () => {
    it('should round to nearest 15-minute slot', () => {
      const date1 = new Date('2024-01-01T06:07:30')
      const rounded1 = roundToNearestSlot(date1)
      expect(rounded1.getMinutes()).toBe(0)
      
      const date2 = new Date('2024-01-01T06:08:00')
      const rounded2 = roundToNearestSlot(date2)
      expect(rounded2.getMinutes()).toBe(15)
      
      const date3 = new Date('2024-01-01T06:22:30')
      const rounded3 = roundToNearestSlot(date3)
      expect(rounded3.getMinutes()).toBe(15)
      
      const date4 = new Date('2024-01-01T06:23:00')
      const rounded4 = roundToNearestSlot(date4)
      expect(rounded4.getMinutes()).toBe(30)
    })
  })

  describe('getWeekDates', () => {
    it('should return 7 dates starting from Sunday', () => {
      const date = new Date('2024-01-03') // Wednesday
      const weekDates = getWeekDates(date)
      
      expect(weekDates).toHaveLength(7)
      expect(weekDates[0].getDay()).toBe(0) // Sunday
      expect(weekDates[6].getDay()).toBe(6) // Saturday
    })

    it('should handle date already on Sunday', () => {
      const date = new Date('2024-01-07') // Sunday
      const weekDates = getWeekDates(date)
      
      expect(weekDates[0].toDateString()).toBe(date.toDateString())
    })
  })

  describe('formatTimeSlot', () => {
    it('should format time correctly', () => {
      const date1 = new Date('2024-01-01T06:00:00')
      expect(formatTimeSlot(date1)).toMatch(/6:00 AM/i)
      
      const date2 = new Date('2024-01-01T13:30:00')
      expect(formatTimeSlot(date2)).toMatch(/1:30 PM/i)
      
      const date3 = new Date('2024-01-01T00:00:00')
      expect(formatTimeSlot(date3)).toMatch(/12:00 AM/i)
    })
  })

  describe('formatHourLabel', () => {
    it('should format hour without minutes when on the hour', () => {
      const date1 = new Date('2024-01-01T06:00:00')
      expect(formatHourLabel(date1)).toMatch(/6 AM/i)
      expect(formatHourLabel(date1)).not.toMatch(/:00/)
    })

    it('should include minutes when not on the hour', () => {
      const date = new Date('2024-01-01T06:30:00')
      expect(formatHourLabel(date)).toMatch(/6:30 AM/i)
    })
  })

  describe('getTotalSlotsPerDay', () => {
    it('should calculate correct total slots', () => {
      const totalSlots = getTotalSlotsPerDay()
      const expectedHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR
      const expectedSlots = (expectedHours * 60) / SLOT_DURATION_MINUTES
      expect(totalSlots).toBe(expectedSlots)
    })
  })

  describe('isWithinCalendarBounds', () => {
    it('should return true for times within bounds', () => {
      expect(isWithinCalendarBounds(new Date('2024-01-01T06:00:00'))).toBe(true)
      expect(isWithinCalendarBounds(new Date('2024-01-01T12:00:00'))).toBe(true)
      expect(isWithinCalendarBounds(new Date('2024-01-01T21:59:00'))).toBe(true)
    })

    it('should return false for times outside bounds', () => {
      expect(isWithinCalendarBounds(new Date('2024-01-01T05:59:00'))).toBe(false)
      expect(isWithinCalendarBounds(new Date('2024-01-01T22:00:00'))).toBe(false)
      expect(isWithinCalendarBounds(new Date('2024-01-01T23:00:00'))).toBe(false)
    })
  })

  describe('getCalendarTimeRange', () => {
    it('should return correct start and end times', () => {
      const date = new Date('2024-01-01T12:00:00')
      const { start, end } = getCalendarTimeRange(date)
      
      expect(start.getHours()).toBe(CALENDAR_START_HOUR)
      expect(start.getMinutes()).toBe(0)
      expect(end.getHours()).toBe(CALENDAR_END_HOUR)
      expect(end.getMinutes()).toBe(0)
      
      // Should be same date
      expect(start.toDateString()).toBe(date.toDateString())
      expect(end.toDateString()).toBe(date.toDateString())
    })
  })

  describe('pixelPositionToTime', () => {
    it('should convert pixel position to time', () => {
      const baseDate = new Date('2024-01-01')
      
      const time1 = pixelPositionToTime(0, baseDate)
      expect(time1.getHours()).toBe(CALENDAR_START_HOUR)
      expect(time1.getMinutes()).toBe(0)
      
      const time2 = pixelPositionToTime(SLOT_HEIGHT_PX, baseDate)
      expect(time2.getHours()).toBe(6)
      expect(time2.getMinutes()).toBe(15)
      
      const time3 = pixelPositionToTime(SLOT_HEIGHT_PX * 4, baseDate)
      expect(time3.getHours()).toBe(7)
      expect(time3.getMinutes()).toBe(0)
    })

    it('should handle partial pixel positions', () => {
      const baseDate = new Date('2024-01-01')
      const time = pixelPositionToTime(25, baseDate) // Between slots
      expect(time.getHours()).toBe(6)
      expect(time.getMinutes()).toBe(15)
    })
  })

  describe('doTimeBlocksOverlap', () => {
    it('should detect overlapping blocks', () => {
      const block1 = {
        startTime: new Date('2024-01-01T06:00:00'),
        endTime: new Date('2024-01-01T07:00:00'),
      }
      
      const block2 = {
        startTime: new Date('2024-01-01T06:30:00'),
        endTime: new Date('2024-01-01T07:30:00'),
      }
      
      expect(doTimeBlocksOverlap(block1, block2)).toBe(true)
    })

    it('should detect non-overlapping blocks', () => {
      const block1 = {
        startTime: new Date('2024-01-01T06:00:00'),
        endTime: new Date('2024-01-01T07:00:00'),
      }
      
      const block2 = {
        startTime: new Date('2024-01-01T07:00:00'),
        endTime: new Date('2024-01-01T08:00:00'),
      }
      
      expect(doTimeBlocksOverlap(block1, block2)).toBe(false)
    })

    it('should handle edge case where blocks touch', () => {
      const block1 = {
        startTime: new Date('2024-01-01T06:00:00'),
        endTime: new Date('2024-01-01T07:00:00'),
      }
      
      const block2 = {
        startTime: new Date('2024-01-01T07:00:00'),
        endTime: new Date('2024-01-01T08:00:00'),
      }
      
      expect(doTimeBlocksOverlap(block1, block2)).toBe(false)
    })
  })

  describe('groupOverlappingBlocks', () => {
    it('should group overlapping blocks together', () => {
      const blocks = [
        {
          id: '1',
          startTime: new Date('2024-01-01T06:00:00'),
          endTime: new Date('2024-01-01T07:00:00'),
        },
        {
          id: '2',
          startTime: new Date('2024-01-01T06:30:00'),
          endTime: new Date('2024-01-01T07:30:00'),
        },
        {
          id: '3',
          startTime: new Date('2024-01-01T08:00:00'),
          endTime: new Date('2024-01-01T09:00:00'),
        },
      ]
      
      const groups = groupOverlappingBlocks(blocks)
      expect(groups).toHaveLength(2)
      expect(groups[0]).toHaveLength(2) // First two blocks overlap
      expect(groups[1]).toHaveLength(1) // Third block is alone
    })

    it('should handle empty array', () => {
      const groups = groupOverlappingBlocks([])
      expect(groups).toHaveLength(0)
    })

    it('should handle single block', () => {
      const blocks = [{
        id: '1',
        startTime: new Date('2024-01-01T06:00:00'),
        endTime: new Date('2024-01-01T07:00:00'),
      }]
      
      const groups = groupOverlappingBlocks(blocks)
      expect(groups).toHaveLength(1)
      expect(groups[0]).toHaveLength(1)
    })
  })

  describe('calculateBlockLayout', () => {
    it('should assign columns to overlapping blocks', () => {
      const blocks = [
        {
          id: '1',
          startTime: new Date('2024-01-01T06:00:00'),
          endTime: new Date('2024-01-01T07:00:00'),
        },
        {
          id: '2',
          startTime: new Date('2024-01-01T06:30:00'),
          endTime: new Date('2024-01-01T07:30:00'),
        },
      ]
      
      const layout = calculateBlockLayout(blocks)
      expect(layout).toHaveLength(2)
      expect(layout[0].column).toBe(1)
      expect(layout[1].column).toBe(2)
      expect(layout[0].columnSpan).toBe(1)
      expect(layout[1].columnSpan).toBe(1)
    })

    it('should handle non-overlapping blocks', () => {
      const blocks = [
        {
          id: '1',
          startTime: new Date('2024-01-01T06:00:00'),
          endTime: new Date('2024-01-01T07:00:00'),
        },
        {
          id: '2',
          startTime: new Date('2024-01-01T08:00:00'),
          endTime: new Date('2024-01-01T09:00:00'),
        },
      ]
      
      const layout = calculateBlockLayout(blocks)
      expect(layout).toHaveLength(2)
      expect(layout[0].column).toBe(1)
      expect(layout[1].column).toBe(1)
    })
  })

  describe('Edge Cases and DST', () => {
    it('should handle daylight saving time transitions', () => {
      // This test would need to be adjusted based on your timezone
      // For now, we'll test that the functions don't throw
      const dstDate = new Date('2024-03-10T02:00:00') // Spring forward in US
      expect(() => timeToSlotIndex(dstDate)).not.toThrow()
      expect(() => roundToNearestSlot(dstDate)).not.toThrow()
    })

    it('should handle midnight edge case', () => {
      const midnight = new Date('2024-01-01T00:00:00')
      const slots = timeToSlotIndex(midnight)
      expect(slots).toBeLessThan(0) // Before calendar start
    })

    it('should handle end of day edge case', () => {
      const endOfDay = new Date('2024-01-01T23:59:59')
      expect(isWithinCalendarBounds(endOfDay)).toBe(false)
    })
  })
})