/*
  # Create hospitals table
  
  1. New Tables
    - `hospitals` - Core hospital information
      - `id` (uuid, primary key)
      - `name` (text)
      - `subdomain` (text, unique)
      - `address` (text) 
      - `phone` (text)
      - `email` (text, optional)
      - `logo_url` (text, optional)
      
  2. Security
    - Enable RLS
    - Allow all authenticated users to read
    - Allow super admins to manage all hospital data
*/

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

-- Policy to allow all authenticated users to read hospital data
CREATE POLICY "Anyone can read hospital data"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow super admins to manage all hospital data
CREATE POLICY "Super admins can manage hospitals"
  ON hospitals
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );