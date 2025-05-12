/*
  # Create patients table
  
  1. New Tables
    - `patients` - Patient information
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `contact_number` (text)
      - `email` (text, optional)
      - `address` (text)
      - `emergency_contact` (jsonb)
      - `medical_history` (jsonb, optional)
      - `hospital_id` (uuid, references hospitals)
      - `status` (text)
      - `current_flow_step` (text, optional)
      
  2. Security
    - Enable RLS
    - Allow hospital staff to access patients in their hospital
*/

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  contact_number text NOT NULL,
  email text,
  address text NOT NULL,
  emergency_contact jsonb NOT NULL,
  medical_history jsonb,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  status text NOT NULL DEFAULT 'active',
  current_flow_step text,
  
  CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female', 'Other')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived'))
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy to allow hospital staff to access patients in their hospital
CREATE POLICY "Hospital staff can access their patients"
  ON patients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = patients.hospital_id
    )
  );

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS patients_hospital_id_idx ON patients (hospital_id);
CREATE INDEX IF NOT EXISTS patients_name_idx ON patients (first_name, last_name);