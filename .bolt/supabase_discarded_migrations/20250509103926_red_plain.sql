/*
  # Fix Patient Table RLS Policies
  
  1. Changes
    - Ensure RLS is enabled on patients table
    - Drop existing policies only if they exist
    - Create policies for patient access with proper checks
    
  2. Security
    - Allow authenticated users to insert patients for their hospital
    - Allow authenticated users to read patients from their hospital
    - Allow hospital staff to manage patients in their hospital
*/

-- Ensure RLS is enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital staff can manage their patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can access patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON patients;

-- Check if policies exist before creating them
DO $$ 
BEGIN
  -- Create insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Authenticated users can insert patients'
  ) THEN
    CREATE POLICY "Authenticated users can insert patients"
      ON patients
      FOR INSERT
      TO authenticated
      WITH CHECK (
        hospital_id IN (
          SELECT hospital_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;

  -- Create read policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Authenticated users can read patients'
  ) THEN
    CREATE POLICY "Authenticated users can read patients"
      ON patients
      FOR SELECT
      TO authenticated
      USING (
        hospital_id IN (
          SELECT hospital_id
          FROM profiles
          WHERE id = auth.uid()
        )
      );
  END IF;

  -- Create management policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Hospital staff can manage their patients'
  ) THEN
    CREATE POLICY "Hospital staff can manage their patients"
      ON patients
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.hospital_id = patients.hospital_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.hospital_id = patients.hospital_id
        )
      );
  END IF;
END $$;