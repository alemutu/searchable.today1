/*
  # Clinical Settings Schema
  
  1. New Tables
    - clinical_protocols: Store clinical protocols and procedures
    - clinical_settings: Store various clinical configurations
    
  2. Security
    - Enable RLS
    - Add policies for clinical staff access
*/

-- Create clinical_protocols table
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  steps jsonb[] NOT NULL,
  is_active boolean DEFAULT true,
  
  UNIQUE(hospital_id, name)
);

-- Create clinical_settings table
CREATE TABLE IF NOT EXISTS clinical_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid NOT NULL REFERENCES hospitals(id),
  type text NOT NULL,
  vital_signs_required text[],
  acuity_levels jsonb[],
  emergency_criteria jsonb[],
  
  UNIQUE(hospital_id, type)
);

-- Enable RLS
ALTER TABLE clinical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for clinical_protocols
CREATE POLICY "Hospital staff can access clinical protocols"
  ON clinical_protocols
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = clinical_protocols.hospital_id
    )
  );

-- Create policies for clinical_settings
CREATE POLICY "Hospital staff can access clinical settings"
  ON clinical_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = clinical_settings.hospital_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS clinical_protocols_hospital_id_idx ON clinical_protocols (hospital_id);
CREATE INDEX IF NOT EXISTS clinical_protocols_category_idx ON clinical_protocols (category);
CREATE INDEX IF NOT EXISTS clinical_settings_hospital_id_idx ON clinical_settings (hospital_id);
CREATE INDEX IF NOT EXISTS clinical_settings_type_idx ON clinical_settings (type);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_clinical_protocols_updated_at
  BEFORE UPDATE ON clinical_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_settings_updated_at
  BEFORE UPDATE ON clinical_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();