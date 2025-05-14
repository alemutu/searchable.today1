/*
  # Fix Super Admin Role and RLS Policies

  1. Changes
    - Fix infinite recursion in RLS policies for profiles table
    - Update searchable.today@gmail.com user to have super_admin role
    - Ensure super_admin users have no hospital_id (they manage all hospitals)
    - Add user_metadata to auth.users for role and hospital_id

  2. Security
    - Rewrite RLS policies to avoid recursion
    - Ensure proper access control for different user roles
*/

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new policies that avoid recursion

-- 1. Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles v2" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role')::text = 'super_admin'
    )
  );

-- 2. Hospital admins can manage profiles in their hospital
CREATE POLICY "Hospital admins can manage profiles in their hospital v2" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE 
        admin_profile.id = auth.uid() AND 
        admin_profile.role = 'admin' AND 
        admin_profile.hospital_id IS NOT NULL AND
        admin_profile.hospital_id = profiles.hospital_id
    )
  );

-- 3. Users can read their own profile
CREATE POLICY "Users can read own profile v2" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 4. Users can read profiles from the same hospital
CREATE POLICY "Users can read profiles from same hospital v2" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS user_profile
      WHERE 
        user_profile.id = auth.uid() AND 
        user_profile.hospital_id IS NOT NULL AND
        user_profile.hospital_id = profiles.hospital_id
    )
  );

-- Update the user with email 'searchable.today@gmail.com' to have super_admin role
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'searchable.today@gmail.com';

-- Make sure the user has no hospital_id assigned (super_admin should not be tied to a specific hospital)
UPDATE profiles
SET hospital_id = NULL
WHERE email = 'searchable.today@gmail.com' AND role = 'super_admin';

-- Update auth.users metadata to include role and hospital_id from profiles
-- This helps avoid RLS recursion by storing key data in auth.users
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id, role, hospital_id FROM profiles LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('role', profile_record.role, 'hospital_id', profile_record.hospital_id)
        ELSE
          raw_user_meta_data || 
          jsonb_build_object('role', profile_record.role, 'hospital_id', profile_record.hospital_id)
      END
    WHERE id = profile_record.id;
  END LOOP;
END $$;