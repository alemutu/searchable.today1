/*
  # Update lab results table

  1. Changes
    - Add IF NOT EXISTS checks for all operations
    - Ensure idempotent execution
    - Prevent duplicate policy creation
*/

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS lab_results_patient_id_idx ON lab_results (patient_id);
CREATE INDEX IF NOT EXISTS lab_results_hospital_id_idx ON lab_results (hospital_id);
CREATE INDEX IF NOT EXISTS lab_results_status_idx ON lab_results (status);

-- Ensure RLS is enabled
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Hospital staff can access lab results" ON lab_results;
CREATE POLICY "Hospital staff can access lab results"
  ON lab_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = lab_results.hospital_id
    )
  );