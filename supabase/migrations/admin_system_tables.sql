-- Admin/Agent View System Tables
-- Run this migration in Supabase SQL Editor

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'agent' CHECK (role IN ('super_admin', 'admin', 'agent')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_view VARCHAR(20) DEFAULT 'agent' CHECK (current_view IN ('admin', 'agent')),
  theme VARCHAR(20) DEFAULT 'dark',
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Feature Toggles Table
CREATE TABLE IF NOT EXISTS feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) NOT NULL,
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'user')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_key, scope, user_id)
);

-- Tool Configurations Table
CREATE TABLE IF NOT EXISTS tool_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key VARCHAR(100) NOT NULL UNIQUE,
  tool_name VARCHAR(100) NOT NULL,
  default_enabled BOOLEAN DEFAULT TRUE,
  ai_model VARCHAR(50) DEFAULT 'claude-sonnet',
  ai_temperature DECIMAL(3,2) DEFAULT 0.7,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents Table
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('voice', 'chat', 'practice')),
  category VARCHAR(50) DEFAULT 'outbound',
  platform VARCHAR(50) DEFAULT 'elevenlabs',
  platform_agent_id VARCHAR(100),
  voice_id VARCHAR(100),
  model VARCHAR(50) DEFAULT 'claude-sonnet',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  persona_role TEXT,
  skills TEXT,
  knowledge_base TEXT,
  constraints TEXT,
  system_prompt TEXT,
  first_message TEXT,
  webhook_url VARCHAR(500),
  timeout_seconds INTEGER DEFAULT 300,
  dynamic_variables JSONB DEFAULT '["contact_name", "property_address", "agent_name"]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agent Versions Table (for version history)
CREATE TABLE IF NOT EXISTS ai_agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT,
  persona_role TEXT,
  skills TEXT,
  knowledge_base TEXT,
  constraints TEXT,
  change_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login Logs Table
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  location JSONB,
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Logs Table
CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  platform VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('call', 'chat', 'practice')),
  direction VARCHAR(20),
  transcript JSONB DEFAULT '[]',
  summary TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  outcome VARCHAR(50),
  disposition VARCHAR(50),
  sentiment VARCHAR(20),
  quality_score INTEGER,
  flagged BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Logs Table
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  service VARCHAR(50),
  status_code INTEGER,
  latency_ms INTEGER,
  request_body JSONB,
  response_body JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature toggles
INSERT INTO feature_toggles (feature_key, scope, is_enabled) VALUES
  ('norx.dashboard', 'global', true),
  ('norx.norlead', 'global', true),
  ('norv.call_workspace', 'global', true),
  ('norv.norcrm', 'global', true),
  ('nordosc.email_writer', 'global', true),
  ('nordosc.letter_writer', 'global', true),
  ('nordosc.sms_writer', 'global', true),
  ('nordosc.template_library', 'global', true),
  ('norw.practice_room', 'global', true),
  ('norw.agent_lab', 'global', true),
  ('norw.call_analyzer', 'global', true),
  ('norw.script_library', 'global', true),
  ('norw.scenario_bank', 'global', true)
ON CONFLICT DO NOTHING;

-- Insert default tool configurations
INSERT INTO tool_configurations (tool_key, tool_name, default_enabled, ai_model, ai_temperature) VALUES
  ('nordosc.email_writer', 'Email Writer', true, 'claude-sonnet', 0.7),
  ('nordosc.letter_writer', 'Letter Writer', true, 'claude-sonnet', 0.7),
  ('nordosc.sms_writer', 'SMS Writer', true, 'claude-sonnet', 0.5)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON user_roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON user_preferences FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON feature_toggles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON tool_configurations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON ai_agents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON ai_agent_versions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON login_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON conversation_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON api_logs FOR ALL USING (auth.role() = 'authenticated');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_agent_id ON conversation_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_created_at ON conversation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
