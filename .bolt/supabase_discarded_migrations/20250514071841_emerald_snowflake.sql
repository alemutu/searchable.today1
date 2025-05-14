/*
  # Enable Developer Mode
  
  1. Changes
    - Create a test user with admin rights
    - Set up credentials for development testing
    - Add necessary permissions for full system access
    
  2. Security
    - User has full access to test all features
    - Can simulate the entire patient flow
*/

-- Create a test user with admin rights
DO $$
DECLARE
  v_user_id uuid;
  v_hospital_id uuid;
  v_department_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'dev@hms.dev';
  
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
      'dev@hms.dev',
      crypt('dev123', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '00000000-0000-0000-0000-000000000000'
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Get a hospital ID to associate with the dev user
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
  
  -- Create or update profile with admin role
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
    'Developer',
    'User',
    'admin', -- Admin role for full access
    v_hospital_id,
    'dev@hms.dev',
    v_department_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'admin',
    first_name = 'Developer',
    last_name = 'User';
END $$;