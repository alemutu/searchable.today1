/*
  # Create Super Admin Account
  
  1. Changes
    - Creates a super admin user with email admin@hms.dev
    - Creates corresponding profile record
    - Sets up necessary permissions and metadata
*/

-- Create super admin account with full privileges
DO $$ 
DECLARE
  super_admin_id uuid := gen_random_uuid();
BEGIN
  -- Create the super admin user account
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    instance_id
  ) VALUES (
    super_admin_id,
    'admin@hms.dev',
    crypt('admin123', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object(
      'role', 'super_admin'
    ),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000'
  );

  -- Create the super admin profile
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    email,
    created_at,
    updated_at
  ) VALUES (
    super_admin_id,
    'Super',
    'Admin',
    'super_admin',
    'admin@hms.dev',
    now(),
    now()
  );
END $$;