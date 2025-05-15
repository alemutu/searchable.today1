/*
  # Add last_sign_in_at column to cached table

  1. Changes
    - Adds the missing 'last_sign_in_at' column to the 'cached' table
    - This column is needed for Supabase authentication caching
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE cached ADD COLUMN last_sign_in_at timestamptz;
  END IF;
END $$;