/*
  # Add email column to cached table

  1. Changes
    - Add `email` column to `cached` table
    - Make it nullable since existing records won't have an email

  2. Security
    - No changes to RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'email'
  ) THEN
    ALTER TABLE cached ADD COLUMN email text;
  END IF;
END $$;