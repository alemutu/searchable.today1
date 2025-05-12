/*
  # Lab Results Table

  1. New Tables
    - `lab_results`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `patient_id` (uuid, references patients)
      - `hospital_id` (uuid, references hospitals)
      - `test_type` (text)
      - `test_date` (date)
      - `results` (jsonb)
      - `status` (text)
      - `reviewed_by` (uuid, references profiles)
      - `reviewed_at` (timestamp)
      - `notes` (text)

  2. Security
    - Enable RLS on `lab_results` table
    - Add policy for hospital staff to access lab results

  3. Indexes
    - Create indexes for patient_id, hospital_id, and status
*/

-- Create lab_results table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lab_results'
  ) THEN
    CREATE TABLE lab_results (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      patient_id uuid NOT NULL REFERENCES patients,
      hospital_id uuid NOT NULL REFERENCES hospitals,
      test_type text NOT NULL,
      test_date date DEFAULT CURRENT_DATE,
      results jsonb,
      status text NOT NULL DEFAULT 'pending',
      reviewed_by uuid REFERENCES profiles,
      reviewed_at timestamptz,
      notes text,
      
      CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'reviewed', 'cancelled'))
    );

    ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

    -- Security Policies
    CREATE POLICY "Hospital staff can access lab results"
      ON lab_results
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.hospital_id = lab_results.hospital_id
        )
      );

    -- Indexes
    CREATE INDEX lab_results_patient_id_idx ON lab_results (patient_id);
    CREATE INDEX lab_results_hospital_id_idx ON lab_results (hospital_id);
    CREATE INDEX lab_results_status_idx ON lab_results (status);
  END IF;
END $$;