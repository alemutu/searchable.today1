/*
  # Add confirmed_at column to cached table

  1. Changes
    - Adds confirmed_at column to the cached table
    - Adds index on confirmed_at for better query performance

  2. Details
    - The confirmed_at column is needed for proper caching functionality
    - This migration is idempotent and will only add the column if it doesn't exist
*/

-- Add confirmed_at column to cached table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE cached ADD COLUMN confirmed_at timestamptz;
    
    -- Create an index on the new column for better performance
    CREATE INDEX IF NOT EXISTS cached_confirmed_at_idx ON cached(confirmed_at);
  END IF;
END $$;