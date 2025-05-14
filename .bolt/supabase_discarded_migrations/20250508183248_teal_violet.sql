-- Create support_settings table
CREATE TABLE IF NOT EXISTS support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  categories jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  sla_settings jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_responses jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  
  UNIQUE(hospital_id)
);

-- Enable RLS
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff access
CREATE POLICY "Hospital staff can access support settings"
  ON support_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = support_settings.hospital_id
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS support_settings_hospital_id_idx ON support_settings (hospital_id);