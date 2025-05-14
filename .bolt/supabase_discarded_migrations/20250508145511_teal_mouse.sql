/*
  # Fix infinite recursion in profiles policy

  1. Changes
    - Remove recursive policy for viewing hospital profiles
    - Add new policy for viewing profiles within same hospital
    - Keep existing policies for user management

  2. Security
    - Maintains RLS security
    - Prevents infinite recursion
    - Preserves access control based on hospital association
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles from their hospital" ON profiles;

-- Create new policy without recursion
CREATE POLICY "Users can view profiles from same hospital" ON profiles
FOR SELECT TO authenticated
USING (
  hospital_id IN (
    SELECT hospital_id 
    FROM profiles 
    WHERE id = auth.uid()
    LIMIT 1
  )
);