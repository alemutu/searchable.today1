/*
  # Add user_metadata column to cached table

  1. Changes
    - Add `user_metadata` JSONB column to `cached` table with default empty JSON object
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'user_metadata'
  ) THEN
    ALTER TABLE cached ADD COLUMN user_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;