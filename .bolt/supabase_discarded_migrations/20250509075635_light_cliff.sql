/*
  # Enhance Patient Registration with Medical Information
  
  1. Changes
    - Add medical_info field to patients table
    - Create function to search patients with their medical information
    - Add indexes for better search performance
    
  2. Security
    - Maintain existing RLS policies
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