-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  command_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', NOW()) + interval '1 month')
);

-- Add index for faster queries
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_reset_at ON ai_usage(reset_at);

-- Add RLS policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own AI usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Only the service role can insert usage records
CREATE POLICY "Service role can insert AI usage" ON ai_usage
  FOR INSERT WITH CHECK (true);

-- Create a view for current month usage
CREATE OR REPLACE VIEW current_month_ai_usage AS
SELECT 
  user_id,
  SUM(tokens_used) as total_tokens_used,
  COUNT(*) as total_requests,
  date_trunc('month', NOW()) as current_month
FROM ai_usage
WHERE created_at >= date_trunc('month', NOW())
GROUP BY user_id;