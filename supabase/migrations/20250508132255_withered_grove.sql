-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage hospital profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new simplified policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can read profiles from same hospital"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
);

CREATE POLICY "Hospital admins can manage hospital profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = auth.uid()
    AND p.role = 'admin'
    AND p.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
    WHERE u.id = auth.uid()
    AND p.role = 'super_admin'
  )
);