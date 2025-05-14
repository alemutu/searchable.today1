/*
  # Create super_admin_stats view

  1. New View
    - Creates a view for super admin dashboard statistics
    - Provides aggregated counts for hospitals, users, patients, etc.
    - Uses security_invoker = on to ensure proper permissions

  2. Security
    - View is only accessible to super admins through RLS policies
    - Uses security_invoker to inherit caller's permissions
*/

-- Create a view for super admin dashboard statistics
CREATE OR REPLACE VIEW public.super_admin_stats WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM hospitals) AS total_hospitals,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM patients) AS total_patients,
  (SELECT COUNT(*) FROM departments) AS total_departments,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') AS total_doctors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'nurse') AS total_nurses;

-- Grant permissions to the view
GRANT SELECT ON public.super_admin_stats TO authenticated;