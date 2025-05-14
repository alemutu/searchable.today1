-- Enable RLS if not already enabled
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage hospitals" ON hospitals;
DROP POLICY IF EXISTS "Anyone can read hospitals" ON hospitals;

-- Policy for super admins to manage hospitals
CREATE POLICY "Super admins can manage hospitals"
ON hospitals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Policy for authenticated users to read hospitals
CREATE POLICY "Anyone can read hospitals"
ON hospitals
FOR SELECT
TO authenticated
USING (true);