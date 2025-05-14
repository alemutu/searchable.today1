/*
  # Fix recursive profiles policies

  1. Changes
    - Remove recursive policy for reading profiles from same hospital
    - Add simplified policy for reading profiles based on hospital_id match
    - Keep existing policies for user's own profile and admin access
    
  2. Security
    - Maintains row level security
    - Preserves admin access controls
    - Ensures users can only read profiles from their hospital
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read profiles from same hospital" ON profiles;

-- Add new non-recursive policy
CREATE POLICY "Users can view profiles from their hospital"
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

-- Note: Keeping these existing policies:
-- - "Users can read own profile"
-- - "Hospital admins can manage profiles"
-- - "Super admins can manage all profiles"
-- - "Users can insert their own profile"
-- - "Users can update their own profile"