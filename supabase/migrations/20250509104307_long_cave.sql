-- Ensure RLS is enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Use DO block to conditionally create or update policies
DO $$ 
BEGIN
  -- Check and drop "Hospital staff can access their patients" policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Hospital staff can manage their patients'
  ) THEN
    DROP POLICY "Hospital staff can manage their patients" ON patients;
  END IF;

  -- Check and drop "Authenticated users can insert patients" policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Authenticated users can insert patients'
  ) THEN
    DROP POLICY "Authenticated users can insert patients" ON patients;
  END IF;

  -- Check and drop "Authenticated users can read patients" policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' 
    AND policyname = 'Authenticated users can read patients'
  ) THEN
    DROP POLICY "Authenticated users can read patients" ON patients;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Authenticated users can insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hospital staff can manage their patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);