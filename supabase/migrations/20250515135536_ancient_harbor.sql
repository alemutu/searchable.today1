/*
  # Add identities column to cached table

  1. Changes
    - Add `identities` column to `cached` table as JSONB array with default empty array
    
  2. Notes
    - The column is nullable since not all cached items will have identities
    - Using JSONB array type to store multiple identities
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'identities'
  ) THEN
    ALTER TABLE cached ADD COLUMN identities JSONB[] DEFAULT ARRAY[]::JSONB[];
  END IF;
END $$;