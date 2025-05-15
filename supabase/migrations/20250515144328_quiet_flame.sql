/*
  # Fix cached table migration

  1. Changes
    - Add DROP TRIGGER IF EXISTS statement to avoid "trigger already exists" error
    - Keep all other functionality the same
*/

CREATE TABLE IF NOT EXISTS cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  app_metadata jsonb DEFAULT '{}'::jsonb,
  aud text,
  confirmed_at timestamptz,
  email text,
  email_confirmed_at timestamptz,
  identities jsonb[] DEFAULT ARRAY[]::jsonb[],
  is_anonymous boolean DEFAULT false,
  last_sign_in_at timestamptz,
  phone text,
  role text,
  user_metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS cached_key_idx ON cached(key);
CREATE INDEX IF NOT EXISTS cached_expires_at_idx ON cached(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS cached_key_key ON cached(key);
CREATE INDEX IF NOT EXISTS cached_confirmed_at_idx ON cached(confirmed_at);
CREATE INDEX IF NOT EXISTS cached_last_sign_in_at_idx ON cached(last_sign_in_at);

-- Enable Row Level Security
ALTER TABLE cached ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid the error
DROP POLICY IF EXISTS "Authenticated users can read cached data" ON cached;
DROP POLICY IF EXISTS "Super admins can manage cached data" ON cached;

-- Create policies
CREATE POLICY "Authenticated users can read cached data"
  ON cached
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage cached data"
  ON cached
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists before creating it
DROP TRIGGER IF EXISTS update_cached_updated_at ON cached;

CREATE TRIGGER update_cached_updated_at
BEFORE UPDATE ON cached
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();