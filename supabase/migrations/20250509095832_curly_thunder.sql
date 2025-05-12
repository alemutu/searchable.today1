/*
  # Fix hospitals table RLS policies

  1. Changes
    - Remove existing RLS policies for hospitals table
    - Add new RLS policies that properly handle super admin access:
      - Super admins can perform all operations
      - Other authenticated users can only read hospital data
      - Ensure proper policy ordering and permissions

  2. Security
    - Enable RLS on hospitals table
    - Add policies for:
      - Super admin full access
      - Authenticated user read access
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Anyone can read hospital data" ON public.hospitals;
DROP POLICY IF EXISTS "Anyone can read hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Super admins can manage hospitals" ON public.hospitals;

-- Create new policies with proper permissions
CREATE POLICY "Super admins can manage hospitals"
ON public.hospitals
AS PERMISSIVE
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

CREATE POLICY "Authenticated users can read hospitals"
ON public.hospitals
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);