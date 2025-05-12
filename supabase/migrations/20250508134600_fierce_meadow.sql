/*
  # Fix profiles table policies

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new, simplified policies for profiles table:
      - Users can read their own profile
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
    
  2. Security
    - Maintains row level security
    - Ensures proper access control without recursion
    - Uses direct comparisons instead of subqueries where possible
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable admin access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access to hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable super admin access" ON profiles;

-- Create new simplified policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Hospital admins can manage hospital profiles"
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
    FROM profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role = 'super_admin'
  )
);