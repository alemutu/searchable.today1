/*
  # Fix Database Relationships and Policies

  1. Changes
    - Fixes foreign key relationships for lab_results and pharmacy tables
    - Updates Row Level Security (RLS) policies to fix infinite recursion issues
    - Simplifies policies for profiles, lab_results, and pharmacy tables

  2. Security
    - Replaces problematic policies with simpler versions
    - Ensures proper access control for hospital staff
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can read profiles from same hospital v2" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital v2" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles v2" ON profiles;

-- Check if policies exist before creating them
DO $$
BEGIN
    -- Check and create "Users can read own profile" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can read own profile'
    ) THEN
        CREATE POLICY "Users can read own profile"
          ON profiles
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);
    END IF;

    -- Check and create "Users can read profiles from same hospital" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can read profiles from same hospital'
    ) THEN
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
    END IF;

    -- Check and create "Hospital admins can manage profiles in their hospital" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Hospital admins can manage profiles in their hospital'
    ) THEN
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
    END IF;

    -- Check and create "Super admins can manage all profiles" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Super admins can manage all profiles'
    ) THEN
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
    END IF;
END $$;

-- Fix lab_results relationships
ALTER TABLE IF EXISTS lab_results
  DROP CONSTRAINT IF EXISTS lab_results_patient_id_fkey;

ALTER TABLE IF EXISTS lab_results
  ADD CONSTRAINT lab_results_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Fix pharmacy relationships
ALTER TABLE IF EXISTS pharmacy
  DROP CONSTRAINT IF EXISTS pharmacy_patient_id_fkey;

ALTER TABLE IF EXISTS pharmacy
  ADD CONSTRAINT pharmacy_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Update lab_results RLS policies
DROP POLICY IF EXISTS "Hospital staff can access lab results" ON lab_results;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lab_results' 
        AND policyname = 'Hospital staff can access lab results'
    ) THEN
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
    END IF;
END $$;

-- Update pharmacy RLS policies
DROP POLICY IF EXISTS "Hospital staff can access pharmacy orders" ON pharmacy;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'pharmacy' 
        AND policyname = 'Hospital staff can access pharmacy orders'
    ) THEN
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
    END IF;
END $$;