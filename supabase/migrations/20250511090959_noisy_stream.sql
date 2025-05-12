/*
  # Update Patient Schema for Registration and Triage
  
  1. Changes
    - Add id_number field to patients table
    - Add priority_level field to patients table
    - Add registration_type field to patients table
    - Add payment_method field to patients table
    - Add initial_status field to patients table
    - Add medical_info field to patients table
    - Update current_flow_step options
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add fields to patients table if they don't exist
DO $$ 
BEGIN
  -- Add id_number field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'id_number'
  ) THEN
    ALTER TABLE patients ADD COLUMN id_number text;
    CREATE INDEX IF NOT EXISTS patients_id_number_idx ON patients(id_number);
  END IF;

  -- Add priority_level field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'priority_level'
  ) THEN
    ALTER TABLE patients ADD COLUMN priority_level text CHECK (priority_level IN ('normal', 'urgent', 'critical')) DEFAULT 'normal';
  END IF;

  -- Add registration_type field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'registration_type'
  ) THEN
    ALTER TABLE patients ADD COLUMN registration_type text CHECK (registration_type IN ('new', 'returning')) DEFAULT 'new';
  END IF;

  -- Add payment_method field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE patients ADD COLUMN payment_method text CHECK (payment_method IN ('cash', 'insurance', 'credit_card', 'debit_card', 'mobile_payment')) DEFAULT 'cash';
  END IF;

  -- Add initial_status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'initial_status'
  ) THEN
    ALTER TABLE patients ADD COLUMN initial_status text CHECK (initial_status IN ('registered', 'activated')) DEFAULT 'registered';
  END IF;

  -- Add medical_info field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'medical_info'
  ) THEN
    ALTER TABLE patients ADD COLUMN medical_info JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX IF NOT EXISTS patients_medical_info_gin_idx ON patients USING gin(medical_info);
  END IF;
END $$;

-- Update the check constraint for current_flow_step to include all possible steps
DO $$ 
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_flow_step' 
    AND conrelid = 'patients'::regclass
  ) THEN
    ALTER TABLE patients DROP CONSTRAINT valid_flow_step;
  END IF;

  -- Add the updated constraint
  ALTER TABLE patients
  ADD CONSTRAINT valid_flow_step CHECK (
    current_flow_step IN (
      'registration',
      'triage',
      'waiting_consultation',
      'consultation',
      'lab_tests',
      'radiology',
      'pharmacy',
      'billing',
      'completed',
      'emergency',
      'post_consultation'
    )
  );
END $$;

-- Update the search_patients function to include searching by ID number
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
    id_number ILIKE '%' || search_term || '%' OR
    medical_info::text ILIKE '%' || search_term || '%';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_patients TO authenticated;