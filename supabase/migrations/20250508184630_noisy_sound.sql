/*
  # Fix Settings Page Errors

  1. New Tables
    - `clinical_protocols`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `hospital_id` (uuid, foreign key to hospitals)
      - `name` (text)
      - `category` (text)
      - `description` (text)
      - `steps` (jsonb array)
      - `is_active` (boolean)

    - `clinical_settings`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `hospital_id` (uuid, foreign key to hospitals)
      - `type` (text)
      - `vital_signs_required` (text array)
      - `acuity_levels` (jsonb array)
      - `emergency_criteria` (jsonb array)

  2. Security
    - Enable RLS on both tables
    - Add policies for hospital staff access
*/

-- Create clinical_protocols table
CREATE TABLE IF NOT EXISTS clinical_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  steps jsonb[] DEFAULT ARRAY[]::jsonb[],
  is_active boolean DEFAULT true
);

-- Create clinical_settings table
CREATE TABLE IF NOT EXISTS clinical_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  type text NOT NULL,
  vital_signs_required text[] DEFAULT ARRAY[]::text[],
  acuity_levels jsonb[] DEFAULT ARRAY[]::jsonb[],
  emergency_criteria jsonb[] DEFAULT ARRAY[]::jsonb[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS clinical_protocols_hospital_id_idx ON clinical_protocols(hospital_id);
CREATE INDEX IF NOT EXISTS clinical_settings_hospital_id_idx ON clinical_settings(hospital_id);

-- Enable RLS
ALTER TABLE clinical_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create updated_at trigger for clinical_protocols
CREATE OR REPLACE FUNCTION update_clinical_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinical_protocols_updated_at
  BEFORE UPDATE ON clinical_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_clinical_protocols_updated_at();