/*
  # Create cached table

  1. New Tables
    - `cached`
      - `id` (uuid, primary key)
      - `key` (text)
      - `value` (jsonb)
      - `expires_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
      - `app_metadata` (jsonb)
  2. Security
    - Enable RLS on `cached` table
    - Add policy for authenticated users to read cached data
    - Add policy for super admins to manage cached data
*/

CREATE TABLE IF NOT EXISTS cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  app_metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS cached_key_idx ON cached(key);
CREATE INDEX IF NOT EXISTS cached_expires_at_idx ON cached(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS cached_key_key ON cached(key);

-- Enable Row Level Security
ALTER TABLE cached ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_cached_updated_at
BEFORE UPDATE ON cached
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();