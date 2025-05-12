/*
  # Create departments table
  
  1. New Tables
    - `departments` - Hospital departments
      - `id` (uuid, primary key)
      - `name` (text)
      - `hospital_id` (uuid, references hospitals)
      - `description` (text, optional)
      
  2. Security
    - Enable RLS
    - Allow hospital staff to read departments
    - Allow hospital admins to manage departments
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  description text,
  
  UNIQUE(hospital_id, name)
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy to allow hospital staff to read departments
CREATE POLICY "Hospital staff can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = departments.hospital_id
    )
  );

-- Policy to allow hospital admins to manage departments
CREATE POLICY "Hospital admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.hospital_id = departments.hospital_id
      AND profiles.role = 'admin'
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS departments_hospital_id_idx ON departments (hospital_id);

-- Update profiles to reference departments
ALTER TABLE profiles
  ADD CONSTRAINT profiles_department_id_fkey
  FOREIGN KEY (department_id)
  REFERENCES departments (id);