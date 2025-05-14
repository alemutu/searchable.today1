/*
  # Create Super Admin Account
  
  1. New Users
    - Create a super admin user with specified credentials
  
  2. Security
    - Set up proper authentication and role assignment
    - Ensure the user has super admin permissions
*/

-- Create super admin user
DO $$
DECLARE
  v_user_id uuid;
  v_hospital_id uuid;
  v_department_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gosearch.link@gmail.com';
  
  IF v_user_id IS NULL THEN
    -- Create auth user
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      instance_id
    )
    VALUES (
      gen_random_uuid(),
      'gosearch.link@gmail.com',
      crypt('@esartoday#$2050', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Get a hospital ID to associate with the super admin
  -- Using the first hospital in the system or Hosi Plus if it exists
  SELECT id INTO v_hospital_id FROM hospitals WHERE subdomain = 'hosiplus';
  
  IF v_hospital_id IS NULL THEN
    -- If Hosi Plus doesn't exist, get any hospital
    SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
  END IF;
  
  -- Get a department ID if available
  IF v_hospital_id IS NOT NULL THEN
    SELECT id INTO v_department_id FROM departments 
    WHERE hospital_id = v_hospital_id 
    LIMIT 1;
  END IF;
  
  -- Create or update profile with super_admin role
  INSERT INTO profiles (
    id,
    first_name,
    last_name,
    role,
    hospital_id,
    email,
    department_id
  )
  VALUES (
    v_user_id,
    'Super',
    'Admin',
    'super_admin', -- This is the key part - setting the role to super_admin
    v_hospital_id,
    'gosearch.link@gmail.com',
    v_department_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'super_admin',
    first_name = 'Super',
    last_name = 'Admin';
    
  -- Log the creation of the super admin
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    changes
  )
  VALUES (
    v_user_id,
    'create',
    'user',
    v_user_id,
    jsonb_build_object(
      'role', 'super_admin',
      'email', 'gosearch.link@gmail.com',
      'created_at', now()
    )
  );
END $$;