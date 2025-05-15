/*
  # Create consultations table

  1. New Tables
    - `consultations` - Patient consultations
    
  2. Security
    - Enable RLS on the table
    - Add policies for hospital staff access
*/

-- Create consultations table if it doesn't exist
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES profiles(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  consultation_date timestamptz NOT NULL DEFAULT now(),
  chief_complaint text NOT NULL,
  diagnosis text,
  treatment_plan text,
  prescriptions jsonb[],
  notes text,
  medical_certificate boolean DEFAULT false,
  department_id uuid NOT NULL REFERENCES departments(id),
  pharmacy_status text DEFAULT 'pending',
  pharmacy_id uuid
);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create policies for consultations
CREATE POLICY "Hospital staff can access consultations"
  ON consultations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = consultations.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS consultations_patient_id_idx ON consultations (patient_id);
CREATE INDEX IF NOT EXISTS consultations_doctor_id_idx ON consultations (doctor_id);
CREATE INDEX IF NOT EXISTS consultations_hospital_id_idx ON consultations (hospital_id);
CREATE INDEX IF NOT EXISTS consultations_department_id_idx ON consultations (department_id);
CREATE INDEX IF NOT EXISTS consultations_consultation_date_idx ON consultations (consultation_date);