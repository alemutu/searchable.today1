/*
  # Create allergies and medical history tables

  1. New Tables
    - `allergies` - Patient allergy records
    - `medical_history` - Patient medical history records
    
  2. Security
    - Enable RLS on all tables
    - Add policies for hospital staff access
*/

-- Create allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  allergen text NOT NULL,
  allergen_type text NOT NULL,
  reaction text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  onset_date date,
  notes text,
  
  CONSTRAINT valid_allergen_type CHECK (allergen_type IN ('medication', 'food', 'environmental', 'insect', 'other')),
  CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'resolved'))
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  condition text NOT NULL,
  condition_type text NOT NULL,
  diagnosis_date date,
  status text NOT NULL DEFAULT 'active',
  treatment text,
  notes text,
  diagnosed_by uuid REFERENCES profiles(id),
  
  CONSTRAINT valid_condition_type CHECK (condition_type IN ('chronic', 'acute', 'surgical', 'injury', 'congenital', 'infectious', 'mental_health', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'in_remission', 'recurrent', 'inactive'))
);

-- Enable Row Level Security
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;

-- Create policies for allergies
CREATE POLICY "Hospital staff can access allergies"
  ON allergies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = allergies.hospital_id
    )
  );

-- Create policies for medical_history
CREATE POLICY "Hospital staff can access medical history"
  ON medical_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = medical_history.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS allergies_patient_id_idx ON allergies (patient_id);
CREATE INDEX IF NOT EXISTS allergies_hospital_id_idx ON allergies (hospital_id);
CREATE INDEX IF NOT EXISTS allergies_allergen_type_idx ON allergies (allergen_type);
CREATE INDEX IF NOT EXISTS allergies_status_idx ON allergies (status);

CREATE INDEX IF NOT EXISTS medical_history_patient_id_idx ON medical_history (patient_id);
CREATE INDEX IF NOT EXISTS medical_history_hospital_id_idx ON medical_history (hospital_id);
CREATE INDEX IF NOT EXISTS medical_history_condition_type_idx ON medical_history (condition_type);
CREATE INDEX IF NOT EXISTS medical_history_status_idx ON medical_history (status);