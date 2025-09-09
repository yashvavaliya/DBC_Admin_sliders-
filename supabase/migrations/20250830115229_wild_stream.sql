/*
  # Admin Analytics and Audit Tables

  1. New Tables
    - `admin_audit_log` - Track all admin actions for security
    - `system_settings` - Store system-wide configuration
    - `user_sessions` - Track user login sessions for analytics

  2. Enhanced Analytics
    - Add last_login tracking to profiles
    - Add session tracking capabilities

  3. Security
    - Enable RLS on all new tables
    - Admin-only access policies
*/

-- Add last_login to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL, -- 'user', 'card', 'system'
  target_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by text,
  updated_at timestamptz DEFAULT now()
);

-- Create user sessions table for analytics
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  is_active boolean DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_email ON admin_audit_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Admin audit log policies (admin access only via application logic)
CREATE POLICY "Admin audit log read access"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (false); -- Will be accessed via service role

CREATE POLICY "Admin audit log insert access"
  ON admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Will be accessed via service role

-- System settings policies
CREATE POLICY "System settings read access"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (false); -- Will be accessed via service role

CREATE POLICY "System settings write access"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (false); -- Will be accessed via service role

-- User sessions policies
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on auth
-- Note: This would need to be set up via Supabase Auth hooks in production

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
  ('email_notifications', 'true', 'Enable admin email notifications'),
  ('auto_backup', 'true', 'Enable automatic daily backups'),
  ('max_cards_per_user', '10', 'Maximum cards per user'),
  ('max_file_size_mb', '5', 'Maximum file upload size in MB')
ON CONFLICT (key) DO NOTHING;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_email text,
  action text,
  target_type text,
  target_id text DEFAULT NULL,
  details jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_email,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    admin_email,
    action,
    target_type,
    target_id,
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;