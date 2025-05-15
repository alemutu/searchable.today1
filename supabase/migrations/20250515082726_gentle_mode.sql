/*
  # Create vital signs table

  1. New Tables
    - `vital_signs` - Patient vital signs records
    
  2. Security
    - Enable RLS on the table
    - Add policies for hospital staff access
*/

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  temperature numeric,
  heart_rate integer,
  respiratory_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  oxygen_saturation integer,
  weight numeric,
  height numeric,
  bmi numeric,
  pain_level integer,
  notes text,
  recorded_by uuid REFERENCES profiles(id)
);

-- Enable Row Level Security
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

-- Create policies for vital_signs
CREATE POLICY "Hospital staff can access vital signs"
  ON vital_signs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = vital_signs.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS vital_signs_patient_id_idx ON vital_signs (patient_id);
CREATE INDEX IF NOT EXISTS vital_signs_hospital_id_idx ON vital_signs (hospital_id);
CREATE INDEX IF NOT EXISTS vital_signs_recorded_at_idx ON vital_signs (recorded_at);