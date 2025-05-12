/*
  # Update Schema for Workflow and Emergency Cases

  1. Changes
    - Add emergency flag to relevant tables
    - Update workflow step tracking
    - Add billing relationships
    - Enhance lab/radiology schema
    
  2. Security
    - Maintain existing RLS policies
    - Add new policies for emergency access
*/

-- Update patients table with registration status
ALTER TABLE patients DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE patients ADD CONSTRAINT valid_status 
  CHECK (status IN ('registered', 'active', 'inactive', 'archived'));

-- Add workflow step validation
ALTER TABLE patients DROP CONSTRAINT IF EXISTS valid_workflow_step;
ALTER TABLE patients ADD CONSTRAINT valid_workflow_step 
  CHECK (current_flow_step IN (
    'registration',
    'triage',
    'waiting_consultation',
    'consultation',
    'lab_radiology',
    'pharmacy',
    'billing',
    'completed',
    'emergency'
  ));

-- Add emergency flag to relevant tables if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'triage' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE triage ADD COLUMN is_emergency boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pharmacy' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE pharmacy ADD COLUMN is_emergency boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE billing ADD COLUMN is_emergency boolean DEFAULT false;
  END IF;
END $$;

-- Update lab_results table with emergency flag and enhanced status
ALTER TABLE lab_results 
  ADD COLUMN IF NOT EXISTS is_emergency boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sample_collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS sample_collected_by uuid REFERENCES profiles(id);

-- Add constraint for lab priority
ALTER TABLE lab_results DROP CONSTRAINT IF EXISTS valid_priority;
ALTER TABLE lab_results ADD CONSTRAINT valid_priority 
  CHECK (priority IN ('normal', 'urgent', 'emergency'));

-- Create radiology_exams table if not exists
CREATE TABLE IF NOT EXISTS radiology_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES patients(id),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  exam_type text NOT NULL,
  exam_date date DEFAULT CURRENT_DATE,
  results jsonb,
  status text NOT NULL DEFAULT 'pending',
  is_emergency boolean DEFAULT false,
  priority text DEFAULT 'normal',
  performed_by uuid REFERENCES profiles(id),
  performed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  notes text,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'reviewed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('normal', 'urgent', 'emergency'))
);

-- Enable RLS on radiology_exams
ALTER TABLE radiology_exams ENABLE ROW LEVEL SECURITY;

-- Add policy for hospital staff access to radiology exams
CREATE POLICY "Hospital staff can access radiology exams"
  ON radiology_exams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = radiology_exams.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS radiology_exams_patient_id_idx ON radiology_exams (patient_id);
CREATE INDEX IF NOT EXISTS radiology_exams_hospital_id_idx ON radiology_exams (hospital_id);
CREATE INDEX IF NOT EXISTS radiology_exams_status_idx ON radiology_exams (status);
CREATE INDEX IF NOT EXISTS radiology_exams_priority_idx ON radiology_exams (priority);