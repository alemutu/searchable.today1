/*
  # Add radiology_results table

  1. New Tables
    - `radiology_results`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `scan_type` (text)
      - `scan_date` (date)
      - `results` (jsonb)
      - `status` (text)
      - `reviewed_by` (uuid, references profiles)
      - `reviewed_at` (timestamp)
      - `notes` (text)
      - `is_emergency` (boolean)
      - `workflow_stage` (text)
      - `scan_info` (jsonb)
      - `assigned_to` (uuid, references profiles)

  2. Security
    - Enable RLS on `radiology_results` table
    - Add policy for hospital staff to access radiology results

  3. Indexes
    - Create indexes for patient_id, hospital_id, and status
*/

-- Create radiology_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS radiology_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  scan_type text NOT NULL,
  scan_date date DEFAULT CURRENT_DATE,
  results jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  notes text,
  is_emergency boolean DEFAULT false,
  workflow_stage text DEFAULT 'pending' CHECK (workflow_stage IN ('pending', 'in_progress', 'completed')),
  scan_info jsonb,
  assigned_to uuid REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE radiology_results ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff access
CREATE POLICY "Hospital staff can access radiology results"
  ON radiology_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = radiology_results.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS radiology_results_patient_id_idx ON radiology_results (patient_id);
CREATE INDEX IF NOT EXISTS radiology_results_hospital_id_idx ON radiology_results (hospital_id);
CREATE INDEX IF NOT EXISTS radiology_results_status_idx ON radiology_results (status);
CREATE INDEX IF NOT EXISTS radiology_results_workflow_stage_idx ON radiology_results (workflow_stage);