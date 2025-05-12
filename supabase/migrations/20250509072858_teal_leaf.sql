/*
  # Add consultations table

  1. New Tables
    - `consultations`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `patient_id` (uuid, references patients.id)
      - `doctor_id` (uuid, references profiles.id)
      - `hospital_id` (uuid, references hospitals.id)
      - `consultation_date` (timestamp with time zone)
      - `chief_complaint` (text)
      - `diagnosis` (text)
      - `treatment_plan` (text)
      - `notes` (text)
      - `medical_certificate` (boolean)

  2. Security
    - Enable RLS on consultations table
    - Add policy for hospital staff to access consultations
*/

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_id uuid NOT NULL REFERENCES profiles(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  consultation_date timestamptz NOT NULL DEFAULT now(),
  chief_complaint text NOT NULL,
  diagnosis text NOT NULL,
  treatment_plan text NOT NULL,
  notes text,
  medical_certificate boolean DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS consultations_patient_id_idx ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS consultations_doctor_id_idx ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS consultations_hospital_id_idx ON consultations(hospital_id);
CREATE INDEX IF NOT EXISTS consultations_consultation_date_idx ON consultations(consultation_date);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create policy for hospital staff to access consultations
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