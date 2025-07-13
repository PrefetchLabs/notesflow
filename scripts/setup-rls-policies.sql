-- NotesFlow RLS Policies Setup Script
-- Run this AFTER setup-database.sql to configure Row Level Security policies
-- These policies ensure users can only access their own data

-- Note: The database dump doesn't show any RLS policies on the public schema tables
-- This suggests the application handles authorization at the API level
-- However, here are recommended RLS policies for better security

-- Enable RLS is already done in setup-database.sql
-- These are example policies you can add if needed

-- User table policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON "user" FOR SELECT 
USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON "user" FOR UPDATE 
USING (auth.uid()::text = id);

-- Session table policies
-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions" 
ON session FOR SELECT 
USING (auth.uid()::text = user_id);

-- Notes table policies
-- Users can view their own notes
CREATE POLICY "Users can view own notes" 
ON notes FOR SELECT 
USING (
  auth.uid()::text = user_id 
  OR EXISTS (
    SELECT 1 FROM collaborators 
    WHERE collaborators.note_id = notes.id 
      AND collaborators.user_id = auth.uid()::text
      AND collaborators.accepted_at IS NOT NULL
  )
);

-- Users can create notes
CREATE POLICY "Users can create notes" 
ON notes FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own notes
CREATE POLICY "Users can update own notes" 
ON notes FOR UPDATE 
USING (
  auth.uid()::text = user_id 
  OR EXISTS (
    SELECT 1 FROM collaborators 
    WHERE collaborators.note_id = notes.id 
      AND collaborators.user_id = auth.uid()::text
      AND collaborators.permission_level IN ('edit', 'admin')
      AND collaborators.accepted_at IS NOT NULL
  )
);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" 
ON notes FOR DELETE 
USING (auth.uid()::text = user_id);

-- Folders table policies
-- Users can view their own folders
CREATE POLICY "Users can view own folders" 
ON folders FOR SELECT 
USING (auth.uid()::text = user_id);

-- Users can create folders
CREATE POLICY "Users can create folders" 
ON folders FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own folders
CREATE POLICY "Users can update own folders" 
ON folders FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Users can delete their own folders
CREATE POLICY "Users can delete own folders" 
ON folders FOR DELETE 
USING (auth.uid()::text = user_id);

-- Time blocks table policies
-- Users can view their own time blocks
CREATE POLICY "Users can view own time blocks" 
ON time_blocks FOR SELECT 
USING (auth.uid()::text = user_id);

-- Users can create time blocks
CREATE POLICY "Users can create time blocks" 
ON time_blocks FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own time blocks
CREATE POLICY "Users can update own time blocks" 
ON time_blocks FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Users can delete their own time blocks
CREATE POLICY "Users can delete own time blocks" 
ON time_blocks FOR DELETE 
USING (auth.uid()::text = user_id);

-- Collaborators table policies
-- Users can view collaborations for notes they own or are part of
CREATE POLICY "Users can view relevant collaborations" 
ON collaborators FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = collaborators.note_id 
      AND (notes.user_id = auth.uid()::text OR collaborators.user_id = auth.uid()::text)
  )
);

-- Note owners can manage collaborators
CREATE POLICY "Note owners can manage collaborators" 
ON collaborators FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = collaborators.note_id 
      AND notes.user_id = auth.uid()::text
  )
);

-- Subscriptions table policies
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" 
ON subscriptions FOR SELECT 
USING (auth.uid()::text = user_id);

-- Devices table policies  
-- Users can view their own devices
CREATE POLICY "Users can view own devices" 
ON devices FOR SELECT 
USING (auth.uid()::text = user_id);

-- Billing history policies
-- Users can view their own billing history
CREATE POLICY "Users can view own billing history" 
ON billing_history FOR SELECT 
USING (auth.uid()::text = user_id);

-- User preferences policies
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" 
ON user_preferences FOR SELECT 
USING (auth.uid()::text = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" 
ON user_preferences FOR UPDATE 
USING (auth.uid()::text = user_id);

-- AI usage policies
-- Users can view their own AI usage
CREATE POLICY "Users can view own AI usage" 
ON ai_usage FOR SELECT 
USING (auth.uid()::text = user_id);

-- Note: System settings table should only be accessible by admin users
-- This would require checking the user's role from the user table