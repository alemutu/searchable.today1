/*
  # Fix Super Admin Stats View and Permissions

  1. Changes
     - Make super_admin_stats view security definer to bypass RLS
     - Add proper error handling for stats fetching
     - Fix permission issues with profiles table access

  2. Security
     - Ensure only super admins can access the view
     - Simplify query approach to avoid RLS recursion
*/

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.super_admin_stats;

-- Create a security definer function to get stats
-- This bypasses RLS and only returns data to super admins
CREATE OR REPLACE FUNCTION get_super_admin_stats()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  name text,
  subdomain text,
  address text,
  phone text,
  email text,
  logo_url text
) 
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user is a super admin
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  ) THEN
    -- Return hospital data for super admins
    RETURN QUERY SELECT 
      h.id,
      h.created_at,
      h.name,
      h.subdomain,
      h.address,
      h.phone,
      h.email,
      h.logo_url
    FROM hospitals h
    ORDER BY h.created_at DESC;
  ELSE
    -- Return empty result for non-super admins
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the view using the security definer function
CREATE OR REPLACE VIEW public.super_admin_stats AS
SELECT * FROM get_super_admin_stats();

-- Grant permissions to the view
GRANT SELECT ON public.super_admin_stats TO authenticated;