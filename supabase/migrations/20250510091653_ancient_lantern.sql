/*
  # Add ID Number to Patients Table

  1. Changes
    - Add `id_number` column to patients table
    - Make it nullable since not all patients may have an ID number
    - Add index for faster lookups

  2. Notes
    - This column will store various types of identification numbers
    - Examples: National ID, Passport Number, etc.
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'id_number'
  ) THEN
    ALTER TABLE patients ADD COLUMN id_number text;
    CREATE INDEX patients_id_number_idx ON patients(id_number);
  END IF;
END $$;