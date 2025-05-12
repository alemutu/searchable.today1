/*
  # Fix Laboratory Schema

  1. Changes
    - Ensure lab_results table exists with proper relationships
    - Add correct foreign key constraints
    - Update RLS policies
    
  2. Security
    - Enable RLS
    - Add policy for hospital staff access
*/

-- Drop existing table if it exists to ensure clean state
DROP TABLE IF EXISTS lab_results CASCADE;

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  test_type text NOT NULL,
  test_date date DEFAULT CURRENT_DATE,
  results jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  notes text,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'reviewed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff access
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS lab_results_patient_id_idx ON lab_results (patient_id);
CREATE INDEX IF NOT EXISTS lab_results_hospital_id_idx ON lab_results (hospital_id);
CREATE INDEX IF NOT EXISTS lab_results_status_idx ON lab_results (status);