import { format, startOfWeek, addDays, differenceInMinutes, addMinutes as dateAddMinutes, startOfDay, endOfDay } from 'date-fns';

// Re-export addMinutes for convenience
export const addMinutes = dateAddMinutes;

// Constants for calendar configuration
export const CALENDAR_START_HOUR = 6; // 6 AM
export const CALENDAR_END_HOUR = 22; // 10 PM
export const SLOT_DURATION_MINUTES = 15;
export const SLOT_HEIGHT_PX = 20;
export const DAY_COLUMN_WIDTH = 'minmax(120px, 1fr)';
export const TIME_COLUMN_WIDTH = '80px';

// Convert time to slot index (0-based)
export function timeToSlotIndex(date: Date): number {
  const startOfCalendarDay = new Date(date);
  startOfCalendarDay.setHours(CALENDAR_START_HOUR, 0, 0, 0);
  
  const minutes = differenceInMinutes(date, startOfCalendarDay);
  return Math.floor(minutes / SLOT_DURATION_MINUTES);
}

// Convert slot index to time
export function slotIndexToTime(slotIndex: number, baseDate: Date = new Date()): Date {
  const date = new Date(baseDate);
  date.setHours(CALENDAR_START_HOUR, 0, 0, 0);
  return dateAddMinutes(date, slotIndex * SLOT_DURATION_MINUTES);
}

// Calculate pixel position from time
export function timeToPixelPosition(date: Date): number {
  const slotIndex = timeToSlotIndex(date);
  return slotIndex * SLOT_HEIGHT_PX;
}

// Calculate duration in slots
export function durationToSlots(startTime: Date, endTime: Date): number {
  const minutes = differenceInMinutes(endTime, startTime);
  return Math.ceil(minutes / SLOT_DURATION_MINUTES);
}

// Round time to nearest slot
export function roundToNearestSlot(date: Date): Date {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES;
  const rounded = new Date(date);
  rounded.setMinutes(roundedMinutes, 0, 0);
  return rounded;
}

// Get week dates for calendar view
export function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const weekDates: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(start, i));
  }
  
  return weekDates;
}

// Format time for display
export function formatTimeSlot(date: Date): string {
  return format(date, 'h:mm a');
}

// Format time without minutes if on the hour
export function formatHourLabel(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0 ? format(date, 'h a') : format(date, 'h:mm a');
}

// Calculate total slots for the day
export function getTotalSlotsPerDay(): number {
  const totalHours = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
  return (totalHours * 60) / SLOT_DURATION_MINUTES;
}

// Check if time is within calendar bounds
export function isWithinCalendarBounds(date: Date): boolean {
  const hours = date.getHours();
  return hours >= CALENDAR_START_HOUR && hours < CALENDAR_END_HOUR;
}

// Get calendar time range for a date
export function getCalendarTimeRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(CALENDAR_START_HOUR, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(CALENDAR_END_HOUR, 0, 0, 0);
  
  return { start, end };
}

// Convert Y position to time based on slot height
export function pixelPositionToTime(yPosition: number, date: Date): Date {
  const slotIndex = Math.floor(yPosition / SLOT_HEIGHT_PX);
  return slotIndexToTime(slotIndex, date);
}

// Calculate overlap for time blocks
export function doTimeBlocksOverlap(
  block1: { startTime: Date; endTime: Date },
  block2: { startTime: Date; endTime: Date }
): boolean {
  return block1.startTime < block2.endTime && block2.startTime < block1.endTime;
}

// Group overlapping time blocks for layout
export function groupOverlappingBlocks<T extends { startTime: Date; endTime: Date }>(
  blocks: T[]
): T[][] {
  if (blocks.length === 0) return [];
  
  const sortedBlocks = [...blocks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const groups: T[][] = [];
  let currentGroup: T[] = [sortedBlocks[0]];
  
  for (let i = 1; i < sortedBlocks.length; i++) {
    const block = sortedBlocks[i];
    const overlapsWithGroup = currentGroup.some(groupBlock => 
      doTimeBlocksOverlap(block, groupBlock)
    );
    
    if (overlapsWithGroup) {
      currentGroup.push(block);
    } else {
      groups.push(currentGroup);
      currentGroup = [block];
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

// Calculate grid column span for overlapping blocks
export function calculateBlockLayout<T extends { startTime: Date; endTime: Date }>(
  blocks: T[]
): Array<T & { column: number; columnSpan: number }> {
  const groups = groupOverlappingBlocks(blocks);
  const layoutBlocks: Array<T & { column: number; columnSpan: number }> = [];
  
  groups.forEach(group => {
    const columns = group.length;
    group.forEach((block, index) => {
      layoutBlocks.push({
        ...block,
        column: index + 1,
        columnSpan: 1,
      });
    });
  });
  
  return layoutBlocks;
}