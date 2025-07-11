'use client';

import { CalendarSidebar } from '@/components/layouts/calendar-sidebar';

interface TimeBlockingCalendarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TimeBlockingCalendar({ isOpen, onToggle }: TimeBlockingCalendarProps) {
  // Simply render the CalendarSidebar component
  return <CalendarSidebar onToggle={onToggle} />;
}