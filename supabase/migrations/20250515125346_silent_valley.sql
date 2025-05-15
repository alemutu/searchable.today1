/*
  # Add cached table for data caching

  1. New Tables
    - `cached`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cached` table
    - Add policy for authenticated users to read cached data
    - Add policy for super admins to manage cached data
*/

-- Create cached table
CREATE TABLE IF NOT EXISTS cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS cached_key_idx ON cached(key);
CREATE INDEX IF NOT EXISTS cached_expires_at_idx ON cached(expires_at);

-- Enable RLS
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
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ));

-- Create trigger to update updated_at
CREATE TRIGGER update_cached_updated_at
  BEFORE UPDATE ON cached
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();