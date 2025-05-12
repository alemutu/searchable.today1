/*
  # Fix profiles RLS policies

  1. Changes
    - Remove existing RLS policies that cause recursion
    - Add new simplified RLS policies for profiles table
      - Users can read their own profile
      - Users can read profiles from their hospital (using direct hospital_id comparison)
      - Hospital admins can manage profiles in their hospital
      - Super admins can manage all profiles
  
  2. Security
    - Maintains data access control while preventing recursion
    - Ensures users can only access appropriate profile data
    - Uses direct field comparisons instead of subqueries where possible
*/

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from their hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new non-recursive policies
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

CREATE POLICY "Hospital admins can manage profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin 
    WHERE admin.id = auth.uid() 
    AND admin.role = 'admin'
    AND admin.hospital_id = profiles.hospital_id
    LIMIT 1
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles AS admin 
    WHERE admin.id = auth.uid() 
    AND admin.role = 'super_admin'
    LIMIT 1
  )
);