/*
  # Initial Schema Setup

  1. New Tables
    - `hospitals`: Core table for hospital information
      - `id` (uuid, primary key)
      - `name` (text)
      - `subdomain` (text, unique)
      - `address` (text)
      - `phone` (text)
      - `email` (text, optional)
      - `logo_url` (text, optional)
    
    - `departments`: Departments within hospitals
      - `id` (uuid, primary key)
      - `name` (text)
      - `hospital_id` (uuid, references hospitals)
      - `description` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading hospitals and departments
*/

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  subdomain text NOT NULL UNIQUE,
  address text NOT NULL,
  phone text NOT NULL,
  email text,
  logo_url text
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  hospital_id uuid NOT NULL REFERENCES hospitals,
  description text,
  
  UNIQUE(hospital_id, name)
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read hospitals
CREATE POLICY "Anyone can read hospitals"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow all authenticated users to read departments
CREATE POLICY "Anyone can read departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS hospitals_subdomain_idx ON hospitals (subdomain);
CREATE INDEX IF NOT EXISTS departments_hospital_id_idx ON departments (hospital_id);