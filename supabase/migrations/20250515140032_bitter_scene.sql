/*
  # Add role column to cached table

  1. Changes
    - Add `role` column to `cached` table
    - Set default value to NULL to maintain compatibility with existing records
    - Make column nullable since not all cached entries may have a role

  2. Notes
    - This migration is required to fix authentication issues
    - The column is added without constraints to ensure backward compatibility
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cached' AND column_name = 'role'
  ) THEN
    ALTER TABLE cached ADD COLUMN role text;
  END IF;
END $$;