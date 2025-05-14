-- Create a function to safely get user role without recursion
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM profiles 
  WHERE id = user_id
  LIMIT 1;
$$;

-- Revoke execute from public and grant to authenticated users only
REVOKE EXECUTE ON FUNCTION get_user_role FROM public;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can read profiles from same hospital"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = u.id
      AND p.hospital_id = profiles.hospital_id
    )
  )
);

CREATE POLICY "Hospital admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = u.id
      AND p.role = 'admin'
      AND p.hospital_id = profiles.hospital_id
    )
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = u.id
      AND p.role = 'super_admin'
    )
  )
);