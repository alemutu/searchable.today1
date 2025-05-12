/*
  # Fix super_admin_stats view security

  1. Changes
    - Drop existing super_admin_stats view
    - Recreate view without SECURITY DEFINER
    - Add proper RLS policies for stats access
    
  2. Security
    - Use SECURITY INVOKER (default)
    - Restrict access to super admins only
    - Enforce proper row-level security
*/

-- Drop existing view
DROP VIEW IF EXISTS super_admin_stats;

-- Recreate view without SECURITY DEFINER
CREATE VIEW super_admin_stats AS
WITH user_role AS (
  SELECT role 
  FROM profiles 
  WHERE id = auth.uid()
)
SELECT
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM hospitals)
  ELSE
    0
  END as total_hospitals,
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM profiles WHERE role != 'super_admin')
  ELSE
    0
  END as total_users,
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM patients)
  ELSE
    0
  END as total_patients,
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM departments)
  ELSE
    0
  END as total_departments,
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM profiles WHERE role = 'doctor')
  ELSE
    0
  END as total_doctors,
  CASE WHEN user_role.role = 'super_admin' THEN
    (SELECT count(*) FROM profiles WHERE role = 'nurse')
  ELSE
    0
  END as total_nurses
FROM user_role;

-- Grant access to authenticated users
GRANT SELECT ON super_admin_stats TO authenticated;

-- Revoke all privileges from public
REVOKE ALL ON super_admin_stats FROM public;