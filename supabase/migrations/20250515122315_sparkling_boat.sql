/*
  # Add id_number column to patients table

  1. New Columns
    - Add `id_number` column to the `patients` table to store patient identification numbers
  
  2. Changes
    - Adds a new column to support patient registration
*/

-- Add id_number column to patients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'id_number'
  ) THEN
    ALTER TABLE patients ADD COLUMN id_number text;
  END IF;
END $$;

-- Create an index on id_number for faster lookups
CREATE INDEX IF NOT EXISTS patients_id_number_idx ON patients(id_number);

-- Update the patients table to ensure id_number is unique within a hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patients_hospital_id_id_number_key'
  ) THEN
    ALTER TABLE patients ADD CONSTRAINT patients_hospital_id_id_number_key 
    UNIQUE (hospital_id, id_number);
  END IF;
END $$;