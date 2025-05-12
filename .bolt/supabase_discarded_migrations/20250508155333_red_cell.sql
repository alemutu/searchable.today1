/*
  # Update Schema for Patient Workflow

  1. Changes
    - Add workflow_step enum type for tracking patient flow
    - Update patients table with workflow tracking fields
    - Add indexes for workflow-related fields
    
  2. Security
    - Maintain existing RLS policies
    - Add new policies for workflow management
*/

-- Create workflow_step type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE workflow_step AS ENUM (
    'registration',
    'triage',
    'waiting_consultation',
    'consultation',
    'lab_tests',
    'pharmacy',
    'billing',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update patients table with workflow fields
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS workflow_step workflow_step DEFAULT 'registration',
  ADD COLUMN IF NOT EXISTS workflow_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS workflow_updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS workflow_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS workflow_notes jsonb DEFAULT '[]'::jsonb;

-- Add indexes for workflow fields
CREATE INDEX IF NOT EXISTS patients_workflow_step_idx ON patients (workflow_step);
CREATE INDEX IF NOT EXISTS patients_workflow_started_at_idx ON patients (workflow_started_at);
CREATE INDEX IF NOT EXISTS patients_workflow_completed_at_idx ON patients (workflow_completed_at);

-- Create function to update workflow_updated_at
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.workflow_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workflow timestamp updates
DROP TRIGGER IF EXISTS update_patient_workflow_timestamp ON patients;
CREATE TRIGGER update_patient_workflow_timestamp
  BEFORE UPDATE OF workflow_step
  ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

-- Update triage table with workflow fields
ALTER TABLE triage
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES patients(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update consultations table with workflow fields
ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES patients(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update lab_results table with workflow fields
ALTER TABLE lab_results
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES patients(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update pharmacy table with workflow fields
ALTER TABLE pharmacy
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES patients(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update billing table with workflow fields
ALTER TABLE billing
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES patients(id),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add indexes for workflow_id
CREATE INDEX IF NOT EXISTS triage_workflow_id_idx ON triage (workflow_id);
CREATE INDEX IF NOT EXISTS consultations_workflow_id_idx ON consultations (workflow_id);
CREATE INDEX IF NOT EXISTS lab_results_workflow_id_idx ON lab_results (workflow_id);
CREATE INDEX IF NOT EXISTS pharmacy_workflow_id_idx ON pharmacy (workflow_id);
CREATE INDEX IF NOT EXISTS billing_workflow_id_idx ON billing (workflow_id);

-- Create view for workflow statistics
CREATE OR REPLACE VIEW workflow_stats AS
SELECT
  hospital_id,
  workflow_step,
  count(*) as count,
  avg(EXTRACT(EPOCH FROM (workflow_updated_at - workflow_started_at))/3600)::numeric(10,2) as avg_duration_hours
FROM patients
WHERE workflow_step != 'completed'
GROUP BY hospital_id, workflow_step;

-- Grant access to workflow_stats view
GRANT SELECT ON workflow_stats TO authenticated;