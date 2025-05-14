/*
  # Create Developer Account with Full Rights
  
  1. Changes
    - Create a new developer user with email searchabletoday@gmail.com
    - Set password to #$Today2030
    - Assign super_admin role for full system access
    - Create corresponding profile entry
    - Add developer permissions for code editing
    
  2. Security
    - User has full access to all system features
    - Can develop and advance the application
    - Has rights to simulate all workflows
*/

-- Create the developer user account with super_admin privileges
DO $$ 
DECLARE
  developer_id uuid := gen_random_uuid();
BEGIN
  -- Create the developer user account in auth.users
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
    developer_id,
    'searchabletoday@gmail.com',
    crypt('#$Today2030', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email'],
      'role', 'super_admin'
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

  -- Create the developer profile
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    email,
    created_at,
    updated_at
  ) VALUES (
    developer_id,
    'Developer',
    'Admin',
    'super_admin',
    'searchabletoday@gmail.com',
    now(),
    now()
  );
  
  -- Add developer permissions
  INSERT INTO developer_permissions (
    profile_id,
    role_id,
    custom_permissions,
    is_active
  ) VALUES (
    developer_id,
    (SELECT id FROM developer_roles WHERE name = 'Lead Developer' LIMIT 1),
    jsonb_build_object(
      'can_modify_all_code', true,
      'can_deploy_to_production', true,
      'can_manage_all_hospitals', true,
      'can_simulate_all_workflows', true
    ),
    true
  );
END $$;