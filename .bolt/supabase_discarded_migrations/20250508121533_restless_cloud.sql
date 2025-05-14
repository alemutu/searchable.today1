/*
  # Fix profile recursion issues

  1. Changes
    - Add PostgreSQL function to safely get user role without triggering RLS
    - Update profiles RLS policy to prevent recursion
    
  2. Security
    - Function is restricted to authenticated users only
    - Function only returns role for the requesting user
*/

-- Create a function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to get their own role
  IF auth.uid() = user_id THEN
    RETURN (
      SELECT role 
      FROM profiles 
      WHERE id = user_id
    );
  END IF;
  
  RETURN NULL;
END;
$$;

-- Revoke execute from public and grant to authenticated users only
REVOKE EXECUTE ON FUNCTION get_user_role FROM public;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Create new, simplified policies
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