/*
  # Create Lab Results Table

  1. New Tables
    - `lab_results`: Core table for laboratory test results
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `test_type` (text)
      - `test_date` (date)
      - `results` (jsonb, optional)
      - `status` (text)
      - `reviewed_by` (uuid, references profiles)
      - `reviewed_at` (timestamptz, optional)
      - `notes` (text, optional)

  2. Security
    - Enable RLS
    - Add policy for authenticated access
*/

CREATE TABLE IF NOT EXISTS lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  test_type text NOT NULL,
  test_date date DEFAULT CURRENT_DATE,
  results jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'reviewed', 'cancelled'))
);

ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to access lab results
CREATE POLICY "Authenticated users can access lab results"
  ON lab_results
  FOR ALL
  TO authenticated
  USING (true);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS lab_results_patient_id_idx ON lab_results (patient_id);
CREATE INDEX IF NOT EXISTS lab_results_hospital_id_idx ON lab_results (hospital_id);
CREATE INDEX IF NOT EXISTS lab_results_status_idx ON lab_results (status);