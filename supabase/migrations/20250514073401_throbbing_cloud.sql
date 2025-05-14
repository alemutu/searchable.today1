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
  -- Using the first hospital in the system or create one if none exists
  SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
  
  IF v_hospital_id IS NULL THEN
    -- Create a test hospital
    INSERT INTO hospitals (
      name,
      subdomain,
      address,
      phone,
      email,
      domain_enabled,
      patient_id_format,
      patient_id_prefix,
      patient_id_digits
    )
    VALUES (
      'Development Hospital',
      'dev',
      '123 Dev Street, Dev City',
      '123-456-7890',
      'dev@hms.dev',
      true,
      'prefix_number',
      'DEV',
      6
    )
    RETURNING id INTO v_hospital_id;
  END IF;
  
  -- Get a department ID if available or create one
  SELECT id INTO v_department_id FROM departments 
  WHERE hospital_id = v_hospital_id 
  LIMIT 1;
  
  IF v_department_id IS NULL THEN
    -- Create a test department
    INSERT INTO departments (
      name,
      hospital_id,
      description
    )
    VALUES (
      'General Medicine',
      v_hospital_id,
      'General medicine department'
    )
    RETURNING id INTO v_department_id;
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