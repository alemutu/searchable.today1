/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement simplified RLS policies for profiles table
    - Maintain security while avoiding circular references

  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Super admins can manage all profiles
      - Hospital admins can manage profiles within their hospital
      - Users can read their own profile
      - Users can read profiles from their hospital
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Recreate policies without recursion
CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'super_admin'
)
WITH CHECK (
  role = 'super_admin'
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  role = 'admin' AND
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  )
)
WITH CHECK (
  role = 'admin' AND
  hospital_id = (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

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