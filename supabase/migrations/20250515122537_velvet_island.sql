/*
  # Add assigned_to column to patients table

  1. New Columns
    - `assigned_to` (uuid) - Reference to the profile ID of the staff member assigned to the patient
    - `last_updated` (timestamp with time zone) - Timestamp of when the patient record was last updated

  2. Changes
    - Adds foreign key constraint from patients.assigned_to to profiles.id
    - Adds default value for last_updated column to use current timestamp
*/

-- Add assigned_to column to patients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE patients ADD COLUMN assigned_to uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Add last_updated column to patients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE patients ADD COLUMN last_updated timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Create index on assigned_to for faster lookups
CREATE INDEX IF NOT EXISTS patients_assigned_to_idx ON patients(assigned_to);

-- Update RLS policies for patients table to include assigned_to access
DROP POLICY IF EXISTS "Hospital staff can access their patients" ON patients;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'patients' 
    AND policyname = 'Hospital staff can access their patients'
  ) THEN
    CREATE POLICY "Hospital staff can access their patients"
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
      );
  END IF;
END $$;

-- Add policy for staff assigned to patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'patients' 
    AND policyname = 'Staff can access patients assigned to them'
  ) THEN
    CREATE POLICY "Staff can access patients assigned to them"
      ON patients
      FOR ALL
      TO authenticated
      USING (
        patients.assigned_to = auth.uid()
      );
  END IF;
END $$;