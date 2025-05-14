/*
  # Fix profiles policy recursion

  1. Changes
    - Drop the recursive policy that was causing infinite loops
    - Add a new policy that allows users to view profiles from their hospital without recursion
    - The new policy uses the user's claims instead of querying the profiles table

  2. Security
    - Maintains row level security
    - Preserves data access control based on hospital association
    - Uses secure JWT claims for authorization
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles from same hospital" ON profiles;

-- Create new policy using claims instead of recursive query
CREATE POLICY "Users can view profiles from same hospital" ON profiles
FOR SELECT TO authenticated
USING (
  hospital_id = (NULLIF(current_setting('request.jwt.claims', true)::json->>'hospital_id', '')::uuid)
);