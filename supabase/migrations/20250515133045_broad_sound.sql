/*
  # Add aud column to cached table

  1. Changes
    - Add the `aud` column to the `cached` table
    - This column is needed for Supabase authentication caching
*/

-- Add the aud column to the cached table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'aud'
  ) THEN
    ALTER TABLE cached ADD COLUMN aud text;
  END IF;
END $$;

-- Create the cached table if it doesn't exist
CREATE TABLE IF NOT EXISTS cached (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  app_metadata jsonb DEFAULT '{}'::jsonb,
  aud text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS cached_key_idx ON cached(key);
CREATE INDEX IF NOT EXISTS cached_expires_at_idx ON cached(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS cached_key_key ON cached(key);

-- Enable Row Level Security
ALTER TABLE cached ENABLE ROW LEVEL SECURITY;

-- Create policies - check if they exist first to avoid errors
DO $$
BEGIN
  -- Check if the read policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cached' 
    AND policyname = 'Authenticated users can read cached data'
  ) THEN
    CREATE POLICY "Authenticated users can read cached data"
      ON cached
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Check if the admin policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cached' 
    AND policyname = 'Super admins can manage cached data'
  ) THEN
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
  END IF;
END $$;

-- Create trigger for updating updated_at column if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_cached_updated_at ON cached;

-- Create the trigger
CREATE TRIGGER update_cached_updated_at
BEFORE UPDATE ON cached
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();