/*
  # Create appointments table
  
  1. New Tables
    - `appointments` - Patient appointments
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references patients)
      - `doctor_id` (uuid, references profiles)
      - `hospital_id` (uuid, references hospitals)
      - `department_id` (uuid, references departments)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `status` (text)
      - `notes` (text, optional)
      
  2. Security
    - Enable RLS
    - Allow hospital staff to manage appointments in their hospital
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients,
  doctor_id uuid NOT NULL REFERENCES profiles,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  department_id uuid NOT NULL REFERENCES departments,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy to allow hospital staff to manage appointments in their hospital
CREATE POLICY "Hospital staff can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = appointments.hospital_id
    )
  );

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS appointments_hospital_id_idx ON appointments (hospital_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments (date);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments (status);