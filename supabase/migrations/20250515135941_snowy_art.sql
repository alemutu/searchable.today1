/*
  # Add phone column to cached table

  1. Changes
    - Add `phone` column to `cached` table
    - Make it nullable since not all cached entries will have a phone number
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'phone'
  ) THEN
    ALTER TABLE cached ADD COLUMN phone text;
  END IF;
END $$;