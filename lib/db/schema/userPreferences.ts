import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey().default('gen_random_uuid()'),
  userId: text('user_id')
    .notNull()
    .unique(),
  
  // Onboarding
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  
  // UI Preferences
  theme: text('theme').default('system'), // 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean('sidebar_collapsed').default(false),
  defaultView: text('default_view').default('dashboard'), // 'dashboard' | 'notes' | 'calendar'
  
  // Editor Preferences
  editorFontSize: text('editor_font_size').default('medium'), // 'small' | 'medium' | 'large'
  editorLineHeight: text('editor_line_height').default('normal'), // 'tight' | 'normal' | 'loose'
  showWordCount: boolean('show_word_count').default(true),
  autoSaveEnabled: boolean('auto_save_enabled').default(true),
  autoSaveInterval: text('auto_save_interval').default('2000'), // milliseconds as string
  
  // Calendar Preferences
  weekStartsOn: text('week_starts_on').default('sunday'), // 'sunday' | 'monday'
  defaultCalendarView: text('default_calendar_view').default('week'), // 'day' | 'week' | 'month'
  workingHoursStart: text('working_hours_start').default('09:00'),
  workingHoursEnd: text('working_hours_end').default('17:00'),
  
  // Notification Preferences
  emailNotifications: boolean('email_notifications').default(true),
  reminderNotifications: boolean('reminder_notifications').default(true),
  collaborationNotifications: boolean('collaboration_notifications').default(true),
  
  // Other preferences
  preferredLanguage: text('preferred_language').default('en'),
  timezone: text('timezone').default('UTC'),
  customSettings: jsonb('custom_settings').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});