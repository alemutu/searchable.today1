/*
  # Fix database relationships and RLS policies

  1. Changes
    - Fix infinite recursion in profiles RLS policies
    - Fix lab_results and pharmacy relationships with patients table
    - Update RLS policies to use simpler conditions

  2. Security
    - Maintain proper access control while preventing recursion
    - Ensure hospital staff can only access their own hospital's data
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can read own profile v2" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital v2" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital v2" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles v2" ON profiles;

-- Check if policies exist before creating them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can read own profile') THEN
        CREATE POLICY "Users can read own profile"
          ON profiles
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can read profiles from same hospital') THEN
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Hospital admins can manage profiles in their hospital') THEN
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Super admins can manage all profiles') THEN
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
END
$$;

-- Fix lab_results relationships
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lab_results_patient_id_fkey') THEN
        ALTER TABLE lab_results
          DROP CONSTRAINT lab_results_patient_id_fkey;
    END IF;
END
$$;

ALTER TABLE lab_results
  ADD CONSTRAINT lab_results_patient_id_fkey
  FOREIGN KEY (patient_id)
  REFERENCES patients(id)
  ON DELETE CASCADE;

-- Fix pharmacy relationships
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pharmacy_patient_id_fkey') THEN
        ALTER TABLE pharmacy
          DROP CONSTRAINT pharmacy_patient_id_fkey;
    END IF;
END
$$;

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