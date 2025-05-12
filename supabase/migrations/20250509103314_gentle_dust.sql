/*
  # Auto-generated Patient IDs
  
  1. Changes
    - Add medical_info field to patients table if it doesn't exist
    - Create search_patients function for searching patients by various fields
    - Add GIN index on medical_info field for better search performance
    
  2. Security
    - Function runs with definer security
    - Restricted search path to public schema
    - Execute permission granted to authenticated users
*/

-- Add medical_info field to patients table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'medical_info'
  ) THEN
    ALTER TABLE patients 
    ADD COLUMN medical_info JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create a function to search patients with their medical information
CREATE OR REPLACE FUNCTION search_patients(search_term TEXT)
RETURNS SETOF patients
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM patients
  WHERE 
    first_name ILIKE '%' || search_term || '%' OR
    last_name ILIKE '%' || search_term || '%' OR
    contact_number ILIKE '%' || search_term || '%' OR
    email ILIKE '%' || search_term || '%' OR
    medical_info::text ILIKE '%' || search_term || '%';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_patients TO authenticated;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS patients_medical_info_gin_idx ON patients USING gin(medical_info);

-- Add patient ID configuration fields to hospitals table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospitals' 
    AND column_name = 'patient_id_format'
  ) THEN
    ALTER TABLE hospitals
    ADD COLUMN patient_id_format text DEFAULT 'prefix_number',
    ADD COLUMN patient_id_prefix text DEFAULT 'PT',
    ADD COLUMN patient_id_digits integer DEFAULT 6,
    ADD COLUMN patient_id_auto_increment boolean DEFAULT true,
    ADD COLUMN patient_id_last_number integer DEFAULT 0;
  END IF;
END $$;

-- Add comment to explain the patient_id_format options
COMMENT ON COLUMN hospitals.patient_id_format IS 'Format options: prefix_number, prefix_year_number, hospital_prefix_number, custom';