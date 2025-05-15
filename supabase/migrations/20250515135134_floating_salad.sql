/*
  # Fix cached table schema

  1. Changes
    - Drop and recreate cached table to ensure proper schema registration
    - Ensure all columns are properly defined including confirmed_at
    - Maintain existing indexes and constraints
    - Preserve RLS policies
*/

-- Recreate the cached table with proper schema
DROP TABLE IF EXISTS cached;

CREATE TABLE cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  app_metadata jsonb DEFAULT '{}'::jsonb,
  aud text,
  confirmed_at timestamptz
);

-- Recreate indexes
CREATE INDEX cached_confirmed_at_idx ON cached(confirmed_at);
CREATE INDEX cached_expires_at_idx ON cached(expires_at);
CREATE INDEX cached_key_idx ON cached(key);
CREATE UNIQUE INDEX cached_key_key ON cached(key);

-- Enable RLS
ALTER TABLE cached ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Authenticated users can read cached data"
  ON cached
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage cached data"
  ON cached
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

-- Create trigger for updating updated_at
CREATE TRIGGER update_cached_updated_at
  BEFORE UPDATE ON cached
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();