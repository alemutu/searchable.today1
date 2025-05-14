/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify access control based on user roles and hospital association
    - Add more efficient policies for profile access

  2. Security
    - Maintain row-level security
    - Ensure users can only access appropriate profiles
    - Prevent infinite recursion in policy evaluation
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital admins can manage profiles in their hospital" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view and manage own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
  )
);

CREATE POLICY "Hospital admins can manage profiles in their hospital"
ON profiles
FOR ALL
TO authenticated
USING (
  (
    -- User is a hospital admin
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    -- And the profile belongs to their hospital
    AND hospital_id = (
      SELECT hospital_id::uuid 
      FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'hospital_id' IS NOT NULL
    )
  )
);

CREATE POLICY "Hospital staff can view profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  hospital_id = (
    SELECT hospital_id::uuid 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'hospital_id' IS NOT NULL
  )
);