# Task Presets Test Plan

## Changes Made:
1. ✅ Added `useAuth` hook to get user info in `calendar-sidebar.tsx`
2. ✅ Passed `userEmail` prop from CalendarSidebar to MinimalCalendar
3. ✅ Updated `MinimalCalendarProps` interface to accept `userEmail`
4. ✅ Modified `handleCreateTask` to accept `title` and `color` parameters
5. ✅ Created `TASK_PRESETS` array with 5 presets (Coding, Research, Break, Crypto, Food)
6. ✅ Added conditional rendering in the create menu:
   - For `samid@pockethunter.io`: Shows preset buttons with emojis and colors
   - For other users: Shows standard "Create task" button

## To Test:
1. Login as `samid@pockethunter.io`
2. Navigate to a page with the calendar sidebar
3. Click and drag on the calendar to select a time range
4. The menu should show:
   - "Create event" button
   - Divider line
   - "TASK PRESETS" header
   - 5 preset buttons with emojis and color indicators
   - Divider line
   - "Custom task" button
5. Click any preset button
6. A task should be created with the preset's title and color

## Expected Behavior:
- Coding preset: Creates task with title "Coding" and blue color (#3B82F6)
- Research preset: Creates task with title "Research" and purple color (#8B5CF6)
- Break preset: Creates task with title "Break" and green color (#10B981)
- Crypto preset: Creates task with title "Crypto" and amber color (#F59E0B)
- Food preset: Creates task with title "Food" and red color (#EF4444)