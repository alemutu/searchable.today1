/*
  # Add id_number column to patients table

  1. Changes
    - Add `id_number` column to the `patients` table
    - This column will store a unique identifier for patients within each hospital
    - Create an index on the id_number column for faster lookups
    - Ensure the combination of hospital_id and id_number is unique

  2. Purpose
    - Resolves the error "Could not find the 'id_number' column of 'patients' in the schema cache"
    - Provides a way to assign unique identifiers to patients within each hospital
*/

-- Add id_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'id_number'
  ) THEN
    ALTER TABLE patients ADD COLUMN id_number text;
  END IF;
END $$;

-- Create index on id_number for faster lookups
CREATE INDEX IF NOT EXISTS patients_id_number_idx ON public.patients USING btree (id_number);

-- Ensure hospital_id and id_number combination is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'patients_hospital_id_id_number_key'
  ) THEN
    ALTER TABLE patients ADD CONSTRAINT patients_hospital_id_id_number_key UNIQUE (hospital_id, id_number);
  END IF;
END $$;