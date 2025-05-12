/*
  # Create profiles table
  
  1. New Tables
    - `profiles` - User profiles and roles
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `role` (text)
      - `hospital_id` (uuid, references hospitals)
      - `email` (text)
      - `avatar_url` (text, optional)
      - `department_id` (uuid, optional)
      - `specialization` (text, optional)
      
  2. Security
    - Enable RLS
    - Allow users to read their own profile
    - Allow hospital admins to manage profiles in their hospital
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  hospital_id uuid REFERENCES hospitals,
  email text NOT NULL,
  avatar_url text,
  department_id uuid,
  specialization text,
  contact_number text,
  
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'visitor'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow hospital admins to manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin
      WHERE admin.id = auth.uid()
      AND admin.hospital_id = profiles.hospital_id
      AND admin.role = 'admin'
    )
  );

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS profiles_hospital_id_idx ON profiles (hospital_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);