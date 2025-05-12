/*
  # Add inpatient management schema
  
  1. New Tables
    - `inpatients`
      - Core patient admission data
      - Vital signs history tracking
      - Medication scheduling
      - Dietary restrictions
      - Care plan management
  
  2. Security
    - Enable RLS on inpatients table
    - Add policy for hospital staff access
  
  3. Performance
    - Add indexes for frequently queried columns
*/

-- Create inpatients table
CREATE TABLE IF NOT EXISTS inpatients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  admission_date timestamptz NOT NULL DEFAULT now(),
  discharge_date timestamptz,
  ward_id uuid NOT NULL,
  bed_number text NOT NULL,
  attending_doctor_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'admitted',
  notes text,
  vital_signs_history jsonb[] DEFAULT ARRAY[]::jsonb[],
  medication_schedule jsonb[] DEFAULT ARRAY[]::jsonb[],
  diet_restrictions text[] DEFAULT ARRAY[]::text[],
  care_plan jsonb,
  
  CONSTRAINT valid_status CHECK (status IN ('admitted', 'discharged', 'transferred', 'deceased')),
  CONSTRAINT valid_discharge_date CHECK (discharge_date IS NULL OR discharge_date > admission_date)
);

-- Enable Row Level Security
ALTER TABLE inpatients ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff access
CREATE POLICY "Hospital staff can access inpatient records"
  ON inpatients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = inpatients.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS inpatients_patient_id_idx ON inpatients (patient_id);
CREATE INDEX IF NOT EXISTS inpatients_hospital_id_idx ON inpatients (hospital_id);
CREATE INDEX IF NOT EXISTS inpatients_ward_id_idx ON inpatients (ward_id);
CREATE INDEX IF NOT EXISTS inpatients_attending_doctor_id_idx ON inpatients (attending_doctor_id);
CREATE INDEX IF NOT EXISTS inpatients_status_idx ON inpatients (status);
CREATE INDEX IF NOT EXISTS inpatients_admission_date_idx ON inpatients (admission_date);
CREATE INDEX IF NOT EXISTS inpatients_discharge_date_idx ON inpatients (discharge_date);