-- Drop existing table if it exists
DROP TABLE IF EXISTS support_settings;

-- Create support_settings table without hospital_id
CREATE TABLE IF NOT EXISTS support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  categories jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  sla_settings jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_responses jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[]
);

-- Enable RLS
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access only
CREATE POLICY "Super admins can manage support settings"
  ON support_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );