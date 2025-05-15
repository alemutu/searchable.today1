/*
  # Create clinical settings tables

  1. New Tables
    - `clinical_settings` - General clinical configuration
    - `clinical_protocols` - Standard clinical protocols
    
  2. Security
    - Enable RLS on all tables
    - Add policies for hospital staff access
    - Add policies for admin management
*/

-- Create clinical_settings table
CREATE TABLE IF NOT EXISTS clinical_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  type text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  UNIQUE(hospital_id, type)
);

-- Create clinical_protocols table
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  steps jsonb[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE clinical_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_protocols ENABLE ROW LEVEL SECURITY;

-- Create policies for clinical_settings
CREATE POLICY "Hospital staff can view clinical settings"
  ON clinical_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = clinical_settings.hospital_id
    )
  );

CREATE POLICY "Hospital admins can manage clinical settings"
  ON clinical_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.hospital_id = clinical_settings.hospital_id
    )
  );

-- Create policies for clinical_protocols
CREATE POLICY "Hospital staff can view clinical protocols"
  ON clinical_protocols
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = clinical_protocols.hospital_id
    )
  );

CREATE POLICY "Hospital admins can manage clinical protocols"
  ON clinical_protocols
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.hospital_id = clinical_protocols.hospital_id
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_clinical_settings_updated_at
  BEFORE UPDATE ON clinical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_protocols_updated_at
  BEFORE UPDATE ON clinical_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default triage configuration for each hospital
INSERT INTO clinical_settings (
  hospital_id,
  type,
  settings
)
SELECT 
  id as hospital_id,
  'triage',
  jsonb_build_object(
    'vital_signs_required', ARRAY['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'pain_level'],
    'acuity_levels', jsonb_build_array(
      jsonb_build_object(
        'level', 1,
        'name', 'Critical',
        'description', 'Immediate life-threatening condition',
        'color', 'red',
        'max_wait_time', 0
      ),
      jsonb_build_object(
        'level', 2,
        'name', 'Emergency',
        'description', 'High risk of deterioration',
        'color', 'orange',
        'max_wait_time', 10
      ),
      jsonb_build_object(
        'level', 3,
        'name', 'Urgent',
        'description', 'Requires urgent care',
        'color', 'yellow',
        'max_wait_time', 30
      ),
      jsonb_build_object(
        'level', 4,
        'name', 'Semi-urgent',
        'description', 'Stable but requires attention',
        'color', 'green',
        'max_wait_time', 60
      ),
      jsonb_build_object(
        'level', 5,
        'name', 'Non-urgent',
        'description', 'Minor condition',
        'color', 'blue',
        'max_wait_time', 120
      )
    ),
    'emergency_criteria', jsonb_build_array(
      jsonb_build_object(
        'condition', 'Cardiac Arrest',
        'description', 'No pulse, unconscious'
      ),
      jsonb_build_object(
        'condition', 'Respiratory Distress',
        'description', 'Severe difficulty breathing'
      ),
      jsonb_build_object(
        'condition', 'Severe Trauma',
        'description', 'Major injuries from accidents'
      )
    )
  )
FROM hospitals
ON CONFLICT (hospital_id, type) DO NOTHING;