/*
  # Create triage table
  
  1. New Tables
    - `triage` - Patient triage records
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `vital_signs` (jsonb)
      - `chief_complaint` (text)
      - `acuity_level` (integer)
      - `notes` (text, optional)
      - `triaged_by` (uuid, references profiles)
      - `department_id` (uuid, references departments)
      - `is_emergency` (boolean)
      
  2. Security
    - Enable RLS
    - Allow hospital staff to access triage records in their hospital
*/

CREATE TABLE IF NOT EXISTS triage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  vital_signs jsonb NOT NULL,
  chief_complaint text NOT NULL,
  acuity_level integer NOT NULL,
  notes text,
  triaged_by uuid NOT NULL REFERENCES profiles,
  department_id uuid REFERENCES departments,
  is_emergency boolean DEFAULT false,
  
  CONSTRAINT valid_acuity_level CHECK (acuity_level BETWEEN 1 AND 5)
);

ALTER TABLE triage ENABLE ROW LEVEL SECURITY;

-- Policy to allow hospital staff to access triage records in their hospital
CREATE POLICY "Hospital staff can access triage records"
  ON triage
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = triage.hospital_id
    )
  );

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS triage_patient_id_idx ON triage (patient_id);
CREATE INDEX IF NOT EXISTS triage_hospital_id_idx ON triage (hospital_id);
CREATE INDEX IF NOT EXISTS triage_acuity_level_idx ON triage (acuity_level);