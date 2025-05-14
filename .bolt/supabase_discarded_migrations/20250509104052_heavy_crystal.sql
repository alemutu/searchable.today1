/*
  # Fix patients table RLS policies

  1. Changes
    - Use DO block with conditional checks to avoid "policy already exists" error
    - Ensure RLS is enabled on patients table
    - Create policies only if they don't already exist:
      - Authenticated users can insert patients
      - Authenticated users can read patients
      - Hospital staff can manage their patients
    
  2. Security
    - Maintains proper access control
    - Ensures hospital staff can manage patients in their hospital
    - Allows authenticated users to insert and read patients
*/

-- Ensure RLS is enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Use DO block to conditionally create policies only if they don't exist
DO $$ 
BEGIN
  -- Check and create "Authenticated users can insert patients" policy
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

  -- Check and create "Authenticated users can read patients" policy
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

  -- Check and create "Hospital staff can manage their patients" policy
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