/*
  # Add is_anonymous column to cached table

  1. Changes
     - Adds the missing 'is_anonymous' column to the 'cached' table
     - Sets default value to false
     - Uses a safe approach to check if the column exists before adding it
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cached' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE cached ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
  END IF;
END $$;