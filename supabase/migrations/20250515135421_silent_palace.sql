/*
  # Add email_confirmed_at column to cached table

  1. Changes
    - Adds the `email_confirmed_at` column to the `cached` table
    - This column is needed for proper authentication flow
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached' AND column_name = 'email_confirmed_at'
  ) THEN
    ALTER TABLE cached ADD COLUMN email_confirmed_at timestamptz;
  END IF;
END $$;