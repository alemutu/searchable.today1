/*
  # Fix hospitals table RLS policies
  
  1. Changes
    - Drop existing policies that might be causing conflicts
    - Create new policies with proper WITH CHECK clauses
    - Ensure super admins can manage hospitals
    - Allow all authenticated users to read hospitals
    
  2. Security
    - Maintain proper access control
    - Fix RLS violation errors when adding new hospitals
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Super admins can manage hospitals" ON hospitals;
DROP POLICY IF EXISTS "Anyone can read hospitals" ON hospitals;

-- Create policy for super admins to manage hospitals
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

-- Create policy for authenticated users to read hospitals
CREATE POLICY "Anyone can read hospitals"
ON hospitals
FOR SELECT
TO authenticated
USING (true);