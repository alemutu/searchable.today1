-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Hospital admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;

-- Create new, optimized policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Hospital admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.hospital_id = profiles.hospital_id
  )
);

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);

-- Grant access to super_admin_stats view
GRANT SELECT ON super_admin_stats TO authenticated;

-- Create policy for hospitals table
DROP POLICY IF EXISTS "Super admins can manage hospitals" ON hospitals;
CREATE POLICY "Super admins can manage hospitals"
ON hospitals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);

-- Create policy for system_settings table
DROP POLICY IF EXISTS "Super admins can manage system settings" ON system_settings;
CREATE POLICY "Super admins can manage system settings"
ON system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);