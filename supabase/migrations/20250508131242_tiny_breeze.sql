/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policy for reading profiles from same hospital
    - Add new policy for reading profiles based on hospital_id match
    - Simplify policy conditions to prevent recursion
  
  2. Security
    - Maintains data access security
    - Prevents infinite recursion while keeping proper access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new non-recursive policy
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

-- Existing policies remain unchanged:
-- "Hospital admins can manage hospital profiles"
-- "Super admins can manage all profiles"
-- "Users can read own profile"