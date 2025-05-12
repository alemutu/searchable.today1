/*
  # Fix get_user_role function

  1. Changes
    - Drop existing get_user_role function
    - Recreate get_user_role function with proper return type
    - Grant execute permission to authenticated users

  2. Security
    - Function is marked as SECURITY DEFINER
    - Explicit search_path set for security
    - Execute permission granted to authenticated users
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Recreate the function with the correct return type
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TABLE (role text)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.role
  FROM profiles p
  WHERE p.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;