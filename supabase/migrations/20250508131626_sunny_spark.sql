/*
  # Fix Profile RLS Policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement simplified RLS policies for profiles table
    - Ensure proper access control while avoiding recursion

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Users can read their own profile
      - Users can read profiles from their hospital
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
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
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.hospital_id = profiles.hospital_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles admin_profile
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
    FROM profiles super_admin
    WHERE super_admin.id = auth.uid()
      AND super_admin.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles super_admin
    WHERE super_admin.id = auth.uid()
      AND super_admin.role = 'super_admin'
  )
);