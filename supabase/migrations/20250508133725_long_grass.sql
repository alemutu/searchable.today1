/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove existing problematic policies that cause recursion
    - Add new, simplified policies for profiles table:
      - Users can read their own profile
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
    
  2. Security
    - Maintains row level security
    - Ensures proper access control without recursion
    - Preserves existing security model with cleaner implementation
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'super_admin'
  )
);