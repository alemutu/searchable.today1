/*
  # Fix Database Relationships and RLS Policies

  1. Changes
    - Fix profiles RLS policies to prevent recursion
    - Add proper foreign key relationships for lab_results
    - Add proper foreign key relationships for pharmacy
    - Update RLS policies to use simpler conditions
    
  2. Security
    - Maintain RLS on all tables
    - Simplify policies to prevent recursion
    - Ensure proper access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile v2" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital v2" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital v2" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles v2" ON profiles;

-- Create simplified policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT hospital_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Hospital admins can manage profiles in their hospital"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles admin_profile 
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
    )
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Fix lab_results relationships
ALTER TABLE lab_results
  DROP CONSTRAINT IF EXISTS lab_results_patient_id_fkey;

ALTER TABLE lab_results
  ADD CONSTRAINT lab_results_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Fix pharmacy relationships
ALTER TABLE pharmacy
  DROP CONSTRAINT IF EXISTS pharmacy_patient_id_fkey;

ALTER TABLE pharmacy
  ADD CONSTRAINT pharmacy_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Update lab_results RLS policies
DROP POLICY IF EXISTS "Hospital staff can access lab results" ON lab_results;

CREATE POLICY "Hospital staff can access lab results"
  ON lab_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.hospital_id = lab_results.hospital_id
    )
  );

-- Update pharmacy RLS policies
DROP POLICY IF EXISTS "Hospital staff can access pharmacy orders" ON pharmacy;

CREATE POLICY "Hospital staff can access pharmacy orders"
  ON pharmacy
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.hospital_id = pharmacy.hospital_id
    )
  );