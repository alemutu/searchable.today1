/*
  # Create Super Admin Statistics View
  
  1. New Views
    - `super_admin_stats` - Provides aggregated statistics for the super admin dashboard
  
  2. Security
    - Grants SELECT permission to authenticated users
*/

-- Create a view for super admin dashboard statistics
CREATE OR REPLACE VIEW public.super_admin_stats AS
SELECT
  (SELECT COUNT(*) FROM hospitals) AS total_hospitals,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM patients) AS total_patients,
  (SELECT COUNT(*) FROM departments) AS total_departments,
  (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') AS total_doctors,
  (SELECT COUNT(*) FROM profiles WHERE role = 'nurse') AS total_nurses;

-- Grant permissions to the view
GRANT SELECT ON public.super_admin_stats TO authenticated;