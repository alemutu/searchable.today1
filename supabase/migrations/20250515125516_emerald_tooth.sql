/*
  # Fix cached table schema

  1. Changes
     - Drops the existing cached table if it exists
     - Creates a new cached table with the correct schema
     - Adds appropriate indexes for performance
     - Enables RLS and adds proper policies
*/

-- Drop the existing table if it exists
DROP TABLE IF EXISTS cached;

-- Create the cached table with the correct schema
CREATE TABLE IF NOT EXISTS cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS cached_key_idx ON cached USING btree (key);
CREATE UNIQUE INDEX IF NOT EXISTS cached_key_key ON cached USING btree (key);
CREATE INDEX IF NOT EXISTS cached_expires_at_idx ON cached USING btree (expires_at);

-- Enable row level security
ALTER TABLE cached ENABLE ROW LEVEL SECURITY;

-- Add policies
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
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  ));

-- Add trigger for updating the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cached_updated_at
BEFORE UPDATE ON cached
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();