/*
  # Add app_metadata column to cached table

  1. Changes
    - Add `app_metadata` column to `cached` table as JSONB with default empty object
    - Make the column nullable to maintain compatibility with existing records

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Sets default value to empty JSONB object
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'app_metadata'
  ) THEN
    ALTER TABLE cached ADD COLUMN app_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;